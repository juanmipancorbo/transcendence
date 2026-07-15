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
	| { type: 'move';    byMe: boolean; col: string; row: number; flips: number; turn: number }
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
	const totalSeconds = Math.floor(ms / 1000);
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
	const turnCountRef = useRef(0);

	let blackTimer: number | undefined;
	let whiteTimer: number | undefined;

	// --- Handler functions start ---
	function onStateInit(payload: ByteReader) {
		const id = payload.readPrefixedUTF();
		const board = payload.readBoard();
		const as = payload.readUint8() as PlayerColor | 0;
		const white = payload.readPrefixedUTF();
		const black = payload.readPrefixedUTF();
		const timeLimit = payload.readInt32();
		const status = payload.readPrefixedUTF() as GameStatus;
		const allowSpectators = payload.readBool();

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
		if (timeLimit !== -1) {
			const format = formatMs(timeLimit);
			setBlackTimeLeftFormat(format);
			setWhiteTimeLeftFormat(format);
		}
	}

	function onBlackAbandon(_: ByteReader) {
		if (myColor === BLACK) {
			message("You abandoned the game!");
			router.push("/lobby");
			return;
		} else message("Black abandoned the game");
		setLog(prev => [{ type: 'abandon', byMe: false }, ...prev]);
		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, status: "FINISHED" as GameStatus, winner: WHITE as PlayerColor };
			stateRef.current = next;
			return next;
		});
	}

	function onWhiteAbandon(_: ByteReader) {
		if (myColor === WHITE) {
			message("You abandoned the game!");
			router.push("/lobby");
			return;
		} else message("White abandoned the game");
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
		message(`Black disconnected, they have ${time / 1000} seconds to reconnect or it will count as an abandon`);
	}

	function onWhiteDisconnect(p: ByteReader) {
		const time = p.readUint32();
		message(`White disconnected, they have ${time / 1000} seconds to reconnect or it will count as an abandon`);
	}

	function onBlackReconnect(_: ByteReader) {
		message("Black reconnected!");
	}

	function onWhiteReconnect(_: ByteReader) {
		message("White reconnected!");
	}

	function onSpectatorJoin(p: ByteReader) {
		setSpectators(prev =>[...prev, p.readPrefixedUTF()]);
	}

	function onSpectatorLeave(p: ByteReader) {
		const id = p.readPrefixedUTF();
		setSpectators(prev =>[...prev.filter(s => s !== id)]);
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
				byMe: yourTurn,
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
		let timeLeft = p.readInt32();

		if (timeLeft !== -1) {
			setBlackTimeLeftFormat(formatMs(timeLeft));
			blackTimer = window.setInterval(() => {
				timeLeft -= 300;
				setBlackTimeLeftFormat(formatMs(timeLeft));
			}, 300);
		}
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
		let timeLeft = p.readInt32();

		if (timeLeft !== -1) {
			setWhiteTimeLeftFormat(formatMs(timeLeft));
			whiteTimer = window.setInterval(() => {
				timeLeft -= 300;
				setWhiteTimeLeftFormat(formatMs(timeLeft));
			}, 300);
		}
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
		if (myColor === BLACK)
			message("You don't have any moves available, so your opponent moves again");
		else message("Black doesn't have any moves available");
	}

	function onWhiteNoMoves() {
		if (myColor === WHITE)
			message("You don't have any moves available, so your opponent moves again");
		else message("White doesn't have any moves available");
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
		const result = p.readUint8() as PlayerColor | 0;
		setUser({ ...user!, currentGame: undefined });
		setState(prev => {
			if (!prev) return prev;
			return {
				...prev,
				status: "FINISHED",
				winner: result
			};
		});
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
		const promises = [];
		const newProfiles = new Map();
		if (state) {
			const white = profiles.get(state.players.white);
			const black = profiles.get(state.players.black);

			if (white) newProfiles.set(state.players.white, white);
			else promises.push(api.user.getProfile(state.players.white));
			if (black) newProfiles.set(state.players.black, black);
			else promises.push(api.user.getProfile(state.players.black));
		}

		for (const spec of spectators) {
			const profile = profiles.get(spec);
			if (profile) newProfiles.set(spec, profile);
			else promises.push(api.user.getProfile(spec));
		}

		Promise.all(promises).then(u => {
			for (const user of u)
				newProfiles.set(user.id, user);

			setProfiles(newProfiles);
		});
	}, [spectators, state]);

	const makeMove = (row: number, col: number) => {
		const state    = stateRef.current;

		if (!state)                    { console.log("makeMove blocked: no state");      return; }
		if (state.status !== "ACTIVE") { console.log("makeMove blocked: not ACTIVE");    return; }
		if (!yourTurn)                 { console.log("makeMove blocked: not your turn"); return; }

		console.log("Move sent row:", row, "col:", col);
		socket.send(buildConsumeTurn(row, col));
	};
	

	const chat = (message: string) => {
		socket.send(buildChat(message));
	};

	const abandon = () => {
		socket.send(build(Protocol.Abandon).freeze());
		setLog(prev => [{ type: 'abandon', byMe: true }, ...prev]);
		window.clearInterval(whiteTimer);
		window.clearInterval(blackTimer);
		router.push("/lobby")
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
		makeMove,
		chat,
		abandon,
		log,
	};
}
