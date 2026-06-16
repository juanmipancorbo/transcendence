"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type GameState, PreGameProtocol, BLACK, Protocol, WHITE, PlayerColor, GameStatus, Board, User, CellState } from "@/types";
import { GameSocket } from "@/lib/ws/socket";
import { WS_URL } from "@/lib/config";
import { build, buildChat, buildConsumeTurn, buildReadyToGame, ByteReader } from "@/lib/ws/stream-utils";
import api from "@/lib/api";
import { getTokens } from "./useAuth";

export function useQueue() {
	const [inQueue, setInQueue] = useState(false);
	const [socket, setSocket] = useState<GameSocket | null>(null);
	const tokens = getTokens();

	function joinQueue(callback: (foundGame: string | Error) => void) {
		const socket = new GameSocket(WS_URL + "/play/quickplay", tokens ? tokens.accessToken : "", (e) => {
			if (e) {
				callback(e);
				return;
			}
			socket.ondisconnect = _ => { setSocket(null); setInQueue(false); }
			socket.on(PreGameProtocol.MatchFound, r => {
				const id = r.readPrefixedUTF();

				setSocket(null);
				callback(id);
			})
		});
		setSocket(socket);
		setInQueue(true);
		console.log("[Matchmaking] Joined queue");
	}
	const leaveQueue = () => {
		if (socket && inQueue) {
			setInQueue(false);
			socket.disconnect(1000);
			console.log("[Matchmaking] Left queue");
		}
	}

	return {
		joinQueue,
		leaveQueue,
		socket,
		inQueue
	}
}

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

function formatMs(ms: number) {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useGame(id: string, onJoin: (err?: Error) => void) {
	const tokens = getTokens();

	const [socket, setSocket] = useState<GameSocket | null>(null);
	const [state, setState] = useState<GameState | null>(null);
	const [yourTurn, setYourTurn] = useState<boolean>(false);
	const [opponentTurn, setOpponentTurn] = useState<boolean>(false);
	const [spectators, setSpectators] = useState<string[]>([]);
	const [profiles, setProfiles] = useState(new Map<string, Pick<User, "xp" | "rank" | "wins" | "username" | "avatarUrl" | "displayName">>());
	const [gameMessage, setGameMessage] = useState({ msg: "", show: false, isError: false });
	const [timeLeftFormat, setTimeLeftFormat] = useState("");
	const [opponentTimeLeftFormat, setOpponentTimeLeftFormat] = useState("");
	const [messages, setMessages] = useState<Array<{ sender: string, message: string }>>([]);
	const [myColor, setMyColor] = useState<PlayerColor | 0>(0);
	const validSet = useMemo(() => {
		if (!state?.validMoves) return new Set<string>();
		return new Set(state.validMoves.map(([r, c]) => `${r},${c}`));
	}, [state?.validMoves]);

	const socketRef   = useRef<GameSocket | null>(null);
	const yourTurnRef = useRef<boolean>(false);
	const stateRef    = useRef<GameState | null>(null);

	let timer: number | undefined;
	let opponentTimer: number | undefined;

	// --- Handler functions start ---
	function onStateInit(payload: ByteReader, socket: GameSocket) {
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
				setYourTurn(yourTurn);  yourTurnRef.current = yourTurn;
				setOpponentTurn(!yourTurn);
				if (yourTurn) {
					const len = payload.readUint8();
					for (let i = 0; i < len; ++i)
					validMoves.push([payload.readUint8(), payload.readUint8()]);
				}
			}
		}

		const scores = getScores(board);
		setState({
			id,
			currentTurn: currentTurn ? currentTurn as PlayerColor : null,
			status, board,
			players: { black, white },
			scores: { black: scores[0], white: scores[1] },
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
			scores: { black: scores[0], white: scores[1] },
			validMoves,
			startedAt,
			allowSpectators,
			timeLimit
		}; 
		setMyColor(as);
		if (timeLimit !== -1) {
			const format = formatMs(timeLimit);
			setTimeLeftFormat(format);
			setOpponentTimeLeftFormat(format);
		}

		socket.send(buildReadyToGame()); // Notify the backend this player is ready
	}

	function onOpponentAbandon(_: ByteReader) {
		setGameMessage({ msg: "Your opponent abandoned the game", show: true, isError: false });
	}

	function onSpectatorJoin(p: ByteReader) {
		setSpectators(prev =>[...prev, p.readPrefixedUTF()]);
	}

	function onSpectatorLeave(p: ByteReader) {
		const id = p.readPrefixedUTF();
		setSpectators(prev =>[...prev.filter(s => s !== id)]);
	}

	function onError(p: ByteReader) {
		setGameMessage({ msg: p.readPrefixedUTF(), show: true, isError: true });
	}

	function onBoardInit(p: ByteReader) {
		const board = p.readBoard();

		setState(prev => {
			if (!prev) return prev;
			return { ...prev, board};
		});
	}

	function onMoveUpdate(p: ByteReader) {
		window.clearInterval(timer);
		window.clearInterval(opponentTimer);

		const length = p.readUint32();
		const updates: { content: CellState; row: number; col: number }[] = [];
		for (let i = 0; i < length; ++i) {
			updates.push({
				content: p.readUint8() as CellState,
				row: p.readUint8(),
				col: p.readUint8(),
			});
		}
		setState(prev => {
			if (!prev) return prev;
			const board = prev.board.map(row => [...row]);
			for (const u of updates) 
				board[u.row][u.col] = u.content;
			const next = { ...prev, board };
			stateRef.current = next;
			return next;
		});
	}

	function onYourTurn(p: ByteReader) {
		let timeLeft = p.readInt32();

		if (timeLeft !== -1) {
			setTimeLeftFormat(formatMs(timeLeft));
			timer = window.setInterval(() => {
				timeLeft -= 300;
				setTimeLeftFormat(formatMs(timeLeft));
			}, 300);
		}
		const validMoves: Array<[number, number]> = [];
		const len = p.readUint32();          // backend writes Uint32
		for (let i = 0; i < len; i++)
			validMoves.push([p.readUint8(), p.readUint8()]);

		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, validMoves};
			stateRef.current = next;
			return next;
		});
		setYourTurn(true);   yourTurnRef.current = true;
		setOpponentTurn(false);
	}

	function onOpponentTurn(p: ByteReader) {
		let timeLeft = p.readInt32();

		if (timeLeft !== -1) {
			setOpponentTimeLeftFormat(formatMs(timeLeft));
			opponentTimer = window.setInterval(() => {
				timeLeft -= 300;
				setOpponentTimeLeftFormat(formatMs(timeLeft));
			}, 300);
		}

		setYourTurn(false);   yourTurnRef.current = false;
		setOpponentTurn(true);
	}

	function onGameStart(_: ByteReader) {
		setGameMessage({ msg: "The game has started", isError: false, show: true });
		setState(prev => {
			if (!prev) return prev;
			const next = { ...prev, status: "ACTIVE" as GameStatus };
			stateRef.current = next;
			return next;
		});
	}

	function onGameEnd(p: ByteReader) {
		const result = p.readUint8() as PlayerColor | 0;
		setYourTurn(false);   yourTurnRef.current = false;
		setOpponentTurn(false);
		setState(prev => {
			if (!prev) return prev;
			return {
				...prev,
				status: "FINISHED",
				winner: result
			};
		});
	}

	function onChatMessage(p: ByteReader) {
		const senderId = p.readPrefixedUTF();
		const message = p.readPrefixedUTF();
		setMessages(prev =>[...prev, { sender: senderId, message: message }]);
	}

	function onNoMoves(_: ByteReader) {
		setGameMessage({ msg: "You can't move so your opponent gets to move again", show: true, isError: false });
	}

	function onOpponentNoMoves(_: ByteReader) {
		setGameMessage({ msg: "Your opponent can't move, so it's your turn again", show: true, isError: false });
	}
	// --- Handler functions end ---

	useEffect(() => {
		const socket = new GameSocket(WS_URL + `/play/join?gameId=${id}`, tokens ? tokens.accessToken : "", (e) => {
			if (e) {
				onJoin(e);
				return;
			}

			setSocket(socket); socketRef.current = socket;
			onJoin();
		});

		// Game socket setup start
		socket.on(Protocol.State, payload => onStateInit(payload, socket));
		socket.on(Protocol.OpponentAbandon, onOpponentAbandon);
		socket.on(Protocol.SpectatorJoin, onSpectatorJoin);
		socket.on(Protocol.SpectatorLeave, onSpectatorLeave);
		socket.on(Protocol.Error, onError);
		socket.on(Protocol.Board, onBoardInit);
		socket.on(Protocol.MoveUpdate, onMoveUpdate);
		socket.on(Protocol.YourTurn, onYourTurn);
		socket.on(Protocol.OpponentTurn, onOpponentTurn);
		socket.on(Protocol.GameStart, onGameStart);
		socket.on(Protocol.GameEnd, onGameEnd);
		socket.on(Protocol.ChatMessage, onChatMessage);
		socket.on(Protocol.NoMoves, onNoMoves);
		socket.on(Protocol.OpponentNoMoves, onOpponentNoMoves);
		// Game socket setup end
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

			console.log(newProfiles);
			setProfiles(newProfiles);
		});
	}, [spectators, state]);

	useEffect(() => {
		if (!gameMessage.show) return;
		setTimeout(() => setGameMessage({...gameMessage, show: false}), 2000);
	}, [gameMessage]);

	const makeMove = (row: number, col: number) => {
		const state    = stateRef.current;
		const yourTurn = yourTurnRef.current;
		const socket   = socketRef.current;

		if (!state)                    { console.log("makeMove blocked: no state");      return; }
		if (state.status !== "ACTIVE") { console.log("makeMove blocked: not ACTIVE");    return; }
		if (!yourTurn)                 { console.log("makeMove blocked: not your turn"); return; }

		console.log("Move sent row:", row, "col:", col);
		socket?.send(buildConsumeTurn(row, col));
	};
	

	const chat = (message: string) => {
		socket?.send(buildChat(message));
	};

	const abandon = () => {
		socketRef.current?.send(build(Protocol.PlayerAbandon).freeze());
		setSocket(prev => {
			prev?.disconnect(1000);
			return null;
		});
		window.clearInterval(timer);
		window.clearInterval(opponentTimer);
		setYourTurn(false);   yourTurnRef.current = false;
		setOpponentTurn(false);
	};

	return {
		socket,
		state,
		yourTurn,
		gameMessage,
		opponentTurn,
		timeLeftFormat,
		opponentTimeLeftFormat,
		myColor,
		profiles,
		validSet,
		makeMove,
		chat,
		abandon
	};
}
