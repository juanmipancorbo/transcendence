"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type GameState, BLACK, Protocol, WHITE, PlayerColor, GameStatus, Board, CellState, PublicUser } from "@/types";
import { build, buildChat, buildConsumeTurn, buildDisconnect, buildJoinGame, buildReadyToGame, ByteReader } from "@/lib/ws/stream-utils";
import api from "@/lib/api";
import { useMsg } from "./useMsg";
import { useWs } from "./useWs";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { levelFromXp } from "@/lib/levels";

export type LogEntry =
	| { type: 'move';    byMe: boolean; player: PlayerColor; col: string; row: number; flips: number; turn: number }
	| { type: 'abandon'; byMe: boolean }

function getScores(board: Board) {
	const scores = [0, 0];
	for (const row of board) {
		for (const cell of row) {
			if (cell === BLACK)
				++scores[0];
			else if (cell === WHITE)
				++scores[1];
		}
	}

	return scores;
}

function getScoreState(board: Board) {
	const scores = getScores(board);
	return { black: scores[0], white: scores[1] };
}

function formatMs(ms: number) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useGame(id: string) {
	const { socket, globalHandler, closeChat, setInGame } = useWs();
	const { message, error } = useMsg();
	const { user, setUser } = useAuth();
	const router = useRouter();

	const [state, setState] = useState<GameState | null>(null);
	const [spectators, setSpectators] = useState<string[]>([]);
	const [profiles, setProfiles] = useState(new Map<string, PublicUser>());
	const [blackTimeLeftFormat, setBlackTimeLeftFormat] = useState("");
	const [whiteTimeLeftFormat, setWhiteTimeLeftFormat] = useState("");
	const [messages, setMessages] = useState<Array<{ sender: string, message: string }>>([]);
	const [myColor, setMyColor] = useState<PlayerColor | 0>(0);
	const [log, setLog] = useState<LogEntry[]>([]);
	const validSet = useMemo(() => {
		if (!state?.validMoves) return new Set<string>();
		return new Set(state.validMoves.map(([r, c]) => `${r},${c}`));
	}, [state?.validMoves]);
	const yourTurn = state !== null && state.status === "ACTIVE" && myColor === state.currentTurn;

	const stateRef    = useRef<GameState | null>(null);
	const myColorRef  = useRef<PlayerColor | 0>(0);
	const profilesRef = useRef(new Map<string, PublicUser>());
	const turnCountRef = useRef(0);
	const abandonRequestedRef = useRef(false);
	const finishedByAbandonRef = useRef(false);
	const activeTimerRef = useRef<PlayerColor | null>(null);

	let blackTimer: number | undefined;
	let whiteTimer: number | undefined;

	function startTimer(color: PlayerColor, initialTime: number) {
		if (initialTime === -1) return;
		let timeLeft = initialTime;
		activeTimerRef.current = color;
		const setTime = color === BLACK ? setBlackTimeLeftFormat : setWhiteTimeLeftFormat;
		setTime(formatMs(timeLeft));
		const deadline = performance.now() + timeLeft;
		const timer = window.setInterval(() => {
			timeLeft = Math.max(0, deadline - performance.now());
			setTime(formatMs(timeLeft));
			if (timeLeft === 0) window.clearInterval(timer);
		}, 100);
		if (color === BLACK) blackTimer = timer;
		else whiteTimer = timer;
	}

	function getPlayerLabel(color: PlayerColor) {
		const fallback = color === BLACK ? "Black" : "White";
		if (myColorRef.current === color) return "You";

		const playerId = color === BLACK
			? stateRef.current?.players.black
			: stateRef.current?.players.white;
		const username = playerId ? profilesRef.current.get(playerId)?.username : undefined;
		if (!username) return fallback;
		return myColorRef.current === 0 ? username + " (" + fallback + ")" : username;
	}

	// --- Handler functions start ---
	function onStateInit(payload: ByteReader) {
		const id = payload.readPrefixedUTF();
		const board = payload.readBoard();
		const as = payload.readUint8() as PlayerColor | 0;
		const white = payload.readPrefixedUTF();
		const black = payload.readPrefixedUTF();
		const timeLimit = payload.readInt32();
		const blackTimeLeft = payload.readInt32();
		const whiteTimeLeft = payload.readInt32();
		const status = payload.readPrefixedUTF() as GameStatus;
		const allowSpectators = payload.readBool();
		const spectators = payload.readUint32();
		const specs: string[] = [];
		for (let i = 0; i < spectators; ++i)
			specs.push(payload.readPrefixedUTF());
		setSpectators([...new Set(specs)]);
		const moveCount = payload.readUint32();
		const initialLog: LogEntry[] = [];
		for (let turn = 1; turn <= moveCount; ++turn) {
			const player = payload.readUint8() as PlayerColor;
			const row = payload.readUint8();
			const col = payload.readUint8();
			const flips = payload.readUint8();
			initialLog.unshift({
				type: "move",
				byMe: as !== 0 && player === as,
				player,
				col: String.fromCharCode(65 + col),
				row: row + 1,
				flips,
				turn,
			});
		}

		let currentTurn: number | undefined;
		let startedAt: number | undefined;
		let validMoves: Array<[number, number]> = [];

		if (status === "ACTIVE") {
			currentTurn = payload.readUint8();
			startedAt = payload.readUint32();
			if (as === BLACK || as === WHITE) {
				const yourTurn = currentTurn === as;
				if (yourTurn) {
					const len = payload.readUint8();
					for (let i = 0; i < len; ++i)
					validMoves.push([payload.readUint8(), payload.readUint8()]);
				}
			}
		}

		const scores = getScoreState(board);
		setState({
			id,
			currentTurn: currentTurn ? currentTurn as PlayerColor : null,
			status, board,
			players: { black, white },
			scores,
			validMoves,
			startedAt,
			allowSpectators,
			timeLimit
		});
		stateRef.current = {
			id,
			currentTurn: currentTurn ? currentTurn as PlayerColor : null,
			status, board,
			players: { black, white },
			scores,
			validMoves,
			startedAt,
			allowSpectators,
			timeLimit
		}; 
		setMyColor(as);  myColorRef.current = as;
		turnCountRef.current = moveCount;
		setLog(initialLog);
		if (as === 0 && user) setUser({ ...user, currentGame: undefined });
		if (timeLimit !== -1) {
			setBlackTimeLeftFormat(formatMs(blackTimeLeft));
			setWhiteTimeLeftFormat(formatMs(whiteTimeLeft));
			if (status === "ACTIVE" && currentTurn)
				startTimer(currentTurn as PlayerColor, currentTurn === BLACK ? blackTimeLeft : whiteTimeLeft);
		}
	}

	function onBlackAbandon(_: ByteReader) {
		finishedByAbandonRef.current = true;
		if (myColorRef.current === BLACK) {
			if (!abandonRequestedRef.current) message("You abandoned the game");
			router.push("/lobby");
			return;
		} else message(getPlayerLabel(BLACK) + " abandoned the game");
		setLog(prev => [{ type: 'abandon', byMe: false }, ...prev]);
		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, status: "FINISHED" as GameStatus, winner: WHITE as PlayerColor };
			stateRef.current = next;
			return next;
		});
	}

	function onWhiteAbandon(_: ByteReader) {
		finishedByAbandonRef.current = true;
		if (myColorRef.current === WHITE) {
			if (!abandonRequestedRef.current) message("You abandoned the game");
			router.push("/lobby");
			return;
		} else message(getPlayerLabel(WHITE) + " abandoned the game");
		setLog(prev => [{ type: 'abandon', byMe: false }, ...prev]);
		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, status: "FINISHED" as GameStatus, winner: BLACK as PlayerColor };
			stateRef.current = next;
			return next;
		});
	}

	function onBlackDisconnect(p: ByteReader) {
		const time = p.readUint32();
		message(getPlayerLabel(BLACK) + " disconnected. Reconnect within " + (time / 1000) + " seconds to avoid forfeiting");
	}

	function onWhiteDisconnect(p: ByteReader) {
		const time = p.readUint32();
		message(getPlayerLabel(WHITE) + " disconnected. Reconnect within " + (time / 1000) + " seconds to avoid forfeiting");
	}

	function onBlackReconnect(_: ByteReader) {
		message(getPlayerLabel(BLACK) + " reconnected");
	}

	function onWhiteReconnect(_: ByteReader) {
		message(getPlayerLabel(WHITE) + " reconnected");
	}

	function onSpectatorJoin(p: ByteReader) {
		const spectatorId = p.readPrefixedUTF();
		if (stateRef.current) {
			const username = profilesRef.current.get(spectatorId)?.username;
			message(username ? username + " joined as spectator" : "A spectator joined");
		}
		setSpectators(prev => prev.includes(spectatorId) ? prev : [...prev, spectatorId]);
	}

	function onSpectatorLeave(p: ByteReader) {
		const spectatorId = p.readPrefixedUTF();
		const username = profilesRef.current.get(spectatorId)?.username;
		message(username ? username + " left the spectators" : "A spectator left");
		setSpectators(prev => prev.filter(id => id !== spectatorId));
	}

	function onError(p: ByteReader) {
		error(p.readPrefixedUTF());
	}

	function onFatalError(p: ByteReader) {
		error(p.readPrefixedUTF());
		setUser({ ...user!, currentGame: undefined });
		router.push("/lobby");
	}

	function onBoardInit(p: ByteReader) {
		const board = p.readBoard();

		setState(prev => {
			if (!prev) return prev;
			return { ...prev, board, scores: getScoreState(board) };
		});
	}

	function onMoveUpdate(p: ByteReader) {
		window.clearInterval(blackTimer);
		window.clearInterval(whiteTimer);
		activeTimerRef.current = null;

		const length = p.readUint32();
		const updates: { content: CellState; row: number; col: number }[] = [];
		for (let i = 0; i < length; ++i) {
			updates.push({
				content: p.readUint8() as CellState,
				row: p.readUint8(),
				col: p.readUint8(),
			});
		}

		const boardBefore = stateRef.current?.board;
		const placed = boardBefore ? updates.find(u => boardBefore[u.row][u.col] === 0) : null;
		if (placed) {
			const turn = ++turnCountRef.current;
			setLog(prev => [{
				type: 'move',
				byMe: placed.content === myColorRef.current,
				player: placed.content as PlayerColor,
				col: String.fromCharCode(65 + placed.col),
				row: placed.row + 1,
				flips: updates.length - 1,
				turn,
			}, ...prev]);
		}

		setState(prev => {
			if (!prev) return prev;
			const board = prev.board.map(row => [...row]);
			for (const u of updates)
				board[u.row][u.col] = u.content;
			const next = { ...prev, board, scores: getScoreState(board) };
			stateRef.current = next;
			return next;
		});
	}

	function onBlackTurn(p: ByteReader) {
		const timeLeft = p.readInt32();
		startTimer(BLACK, timeLeft);
		const validMoves: Array<[number, number]> = [];
		const len = p.readUint32();
		for (let i = 0; i < len; i++)
			validMoves.push([p.readUint8(), p.readUint8()]);

		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, validMoves, currentTurn: BLACK as PlayerColor };
			stateRef.current = next;
			return next;
		});
	}

	function onWhiteTurn(p: ByteReader) {
		const timeLeft = p.readInt32();
		startTimer(WHITE, timeLeft);
		const validMoves: Array<[number, number]> = [];
		const len = p.readUint32();          // backend writes Uint32
		for (let i = 0; i < len; i++)
			validMoves.push([p.readUint8(), p.readUint8()]);

		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, validMoves, currentTurn: WHITE as PlayerColor };
			stateRef.current = next;
			return next;
		});
	}

	function onBlackNoMoves() {
		if (myColorRef.current === BLACK)
			message("You don't have any moves available, so your opponent moves again");
		else message(getPlayerLabel(BLACK) + " doesn't have any moves available");
	}

	function onWhiteNoMoves() {
		if (myColorRef.current === WHITE)
			message("You don't have any moves available, so your opponent moves again");
		else message(getPlayerLabel(WHITE) + " doesn't have any moves available");
	}

	function onGameStart(_: ByteReader) {
		message("The game has started");
		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, status: "ACTIVE" as GameStatus };
			stateRef.current = next;
			return next;
		});
	}

	function onGameEnd(p: ByteReader) {
		window.clearInterval(blackTimer);
		window.clearInterval(whiteTimer);
		const result = p.readUint8() as PlayerColor | 0;
		if (activeTimerRef.current === BLACK) setBlackTimeLeftFormat(formatMs(0));
		if (activeTimerRef.current === WHITE) setWhiteTimeLeftFormat(formatMs(0));
		activeTimerRef.current = null;
		if (!finishedByAbandonRef.current) message("Game finished");
		setUser({ ...user!, currentGame: undefined });
		socket.handlers = globalHandler;
		setInGame(false);
		const current = stateRef.current;
		if (current) {
			const next = {
				...current,
				status: "FINISHED" as GameStatus,
				winner: result
			};
			stateRef.current = next;
			setState(next);
		}
	}

	function onXpUpdate(p: ByteReader) {
		const newXp = p.readUint32();
		if (user) {
			user.xp = newXp;
			user.level = levelFromXp(newXp);

			// TODO: Something like an animation or whatever for xp gained / leveled up
		}
	}

	function onChatMessage(p: ByteReader) {
		const senderId = p.readPrefixedUTF();
		const message = p.readPrefixedUTF();
		setMessages(prev => [...prev, { sender: senderId, message: message }]);
	}
	// --- Handler functions end ---

	useEffect(() => {
		closeChat();

		// Game socket setup start
		const callbacks: ((p: ByteReader) => void)[] = [];

		callbacks[Protocol.State] = onStateInit;
		callbacks[Protocol.BlackAbandon] = onBlackAbandon;
		callbacks[Protocol.WhiteAbandon] = onWhiteAbandon;
		callbacks[Protocol.BlackDisconnect] = onBlackDisconnect;
		callbacks[Protocol.WhiteDisconnect] = onWhiteDisconnect;
		callbacks[Protocol.BlackReconnect] = onBlackReconnect;
		callbacks[Protocol.WhiteReconnect] = onWhiteReconnect;
		callbacks[Protocol.SpectatorJoin] = onSpectatorJoin;
		callbacks[Protocol.SpectatorLeave] = onSpectatorLeave;
		callbacks[Protocol.Error] = onError;
		callbacks[Protocol.FatalError] = onFatalError;
		callbacks[Protocol.Board] = onBoardInit;
		callbacks[Protocol.MoveUpdate] = onMoveUpdate;
		callbacks[Protocol.BlackTurn] = onBlackTurn;
		callbacks[Protocol.WhiteTurn] = onWhiteTurn;
		callbacks[Protocol.BlackNoMoves] = onBlackNoMoves;
		callbacks[Protocol.WhiteNoMoves] = onWhiteNoMoves;
		callbacks[Protocol.GameStart] = onGameStart;
		callbacks[Protocol.GameEnd] = onGameEnd;
		callbacks[Protocol.ChatMessage] = onChatMessage;
		callbacks[Protocol.XpUpdate] = onXpUpdate;

		socket.handlers = callbacks;
		// Game socket setup end

		socket.send(buildJoinGame(id));
		setInGame(true);
		setUser({ ...user!, currentGame: id });
		socket.send(buildReadyToGame()); // Notify the backend this player is ready

		return () => {
			if (stateRef.current?.status === "ACTIVE")
				socket.send(buildDisconnect());
			socket.handlers = globalHandler;
			setInGame(false);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		const promises = [];
		// Profiles remain cached for historical chat authors after they leave.
		const newProfiles = new Map(profilesRef.current);
		const requiredIds = new Set(spectators);
		if (state) {
			requiredIds.add(state.players.white);
			requiredIds.add(state.players.black);
		}
		for (const chatMessage of messages)
			requiredIds.add(chatMessage.sender);

		for (const id of requiredIds) {
			if (!newProfiles.has(id))
				promises.push(api.user.getProfile(id));
		}

		Promise.all(promises).then(u => {
			if (cancelled) return;
			for (const user of u)
				newProfiles.set(user.id, user);

			profilesRef.current = newProfiles;
			setProfiles(newProfiles);
		});

		return () => { cancelled = true; };
	}, [spectators, state, messages]);

	const makeMove = (row: number, col: number) => {
		const state    = stateRef.current;

		if (!state) return;
		if (state.status !== "ACTIVE") return;
		if (!yourTurn) return;
		socket.send(buildConsumeTurn(row, col));
	};
	

	const chat = (message: string) => {
		socket.send(buildChat(message));
	};

	const abandon = () => {
		const current = stateRef.current;
		if (!current || current.status === "FINISHED") return;

		abandonRequestedRef.current = true;
		finishedByAbandonRef.current = true;
		const finished = { ...current, status: "FINISHED" as GameStatus };
		stateRef.current = finished;
		setState(finished);
		sessionStorage.setItem("locallyAbandonedGame", current.id);
		setUser({ ...user!, currentGame: undefined });
		message("You abandoned the game");
		socket.send(build(Protocol.Abandon).freeze());
		setLog(prev => [{ type: 'abandon', byMe: true }, ...prev]);
		window.clearInterval(whiteTimer);
		window.clearInterval(blackTimer);
		router.push("/lobby");
	};

	return {
		socket,
		state,
		yourTurn,
		blackTimeLeftFormat,
		whiteTimeLeftFormat,
		myColor,
		profiles,
		spectators,
		validSet,
		messages,
		userId: user?.id ?? "",
		makeMove,
		chat,
		abandon,
		log,
	};
}
