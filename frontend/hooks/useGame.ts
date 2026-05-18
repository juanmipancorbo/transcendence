"use client";

import { useEffect, useState } from "react";
import { type GameState, PreGameProtocol, BLACK, Protocol, WHITE, PlayerColor, GameStatus, Board, User, CellState } from "@/types";
import { GameSocket } from "@/lib/ws/socket";
import { WS_URL } from "@/lib/config";
import { buildChat, buildConsumeTurn, buildReadyToGame } from "@/lib/ws/stream-utils";
import api from "@/lib/api";

export function useQueue() {
	const [inQueue, setInQueue] = useState(false);
	const [socket, setSocket] = useState<GameSocket | null>(null);

	function joinQueue(callback: (foundGame: string | Error) => void) {
		const socket = new GameSocket(WS_URL + "/matches/quickplay", (e) => {
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
	}
	const leaveQueue = () => {
		if (socket && inQueue) {
			setInQueue(false);
			socket.disconnect(0);
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
	const validSet  = new Set(state ? state.validMoves.map(([r, c]) => `${r},${c}`) : null);

	let timer: number | undefined;
	let opponentTimer: number | undefined;

	useEffect(() => {
		const socket = new GameSocket(WS_URL + `/matches/join?gameId=${id}`, (e) => {
			if (e) {
				onJoin(e);
				return;
			}

			setSocket(socket);
			onJoin();
		});
		socket.on(Protocol.State, payload => {
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
					setYourTurn(yourTurn);
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
			setMyColor(as);
			if (timeLimit !== -1) {
				const format = formatMs(timeLimit);
				setTimeLeftFormat(format);
				setOpponentTimeLeftFormat(format);
			}

			socket.send(buildReadyToGame()); // Notify the backend this player is ready
		});

		// Game socket setup start
		socket.on(Protocol.OpponentAbandon, _ => setGameMessage({ msg: "Your opponent abandoned the game", show: true, isError: false }));
		socket.on(Protocol.SpectatorJoin, p => setSpectators([...spectators, p.readPrefixedUTF()]));
		socket.on(Protocol.SpectatorLeave, p => {
			const id = p.readPrefixedUTF();
			setSpectators(spectators.filter(s => s !== id));
		});
		socket.on(Protocol.Error, p => setGameMessage({ msg: p.readPrefixedUTF(), show: true, isError: true }));
		socket.on(Protocol.Board, p => setState(state ? { ...state, board: p.readBoard() } : null));
		socket.on(Protocol.MoveUpdate, p => {
			window.clearInterval(timer);
			window.clearInterval(opponentTimer);

			const board = state ? [...state.board] : null;
			if (!board) return;

			const length = p.readUint8();
			for (let i = 0; i < length; ++i) {
				const content = p.readUint8();
				const row = p.readUint8();
				const col = p.readUint8();
				board[row][col] = content as CellState;
			}

			setState({ ...state as GameState, board: board });
		});
		socket.on(Protocol.YourTurn, p => {
			let timeLeft = p.readInt32();

			if (timeLeft !== -1) {
				setTimeLeftFormat(formatMs(timeLeft));
				timer = window.setInterval(() => {
					timeLeft -= 300;
					setTimeLeftFormat(formatMs(timeLeft));
				}, 300);
			}

			setYourTurn(true);
			setOpponentTurn(false);
		});
		socket.on(Protocol.OpponentTurn, p => {
			let timeLeft = p.readInt32();

			if (timeLeft !== -1) {
				setOpponentTimeLeftFormat(formatMs(timeLeft));
				opponentTimer = window.setInterval(() => {
					timeLeft -= 300;
					setOpponentTimeLeftFormat(formatMs(timeLeft));
				}, 300);
			}

			setYourTurn(false);
			setOpponentTurn(true);
		});
		socket.on(Protocol.GameStart, _ => { setGameMessage({ msg: "The game has started", isError: false, show: true }) });
		socket.on(Protocol.GameEnd, p => {
			const result = p.readUint8() as PlayerColor | 0;
			setYourTurn(false);
			setOpponentTurn(false);
			setState({ ...state as GameState, status: "FINISHED", winner: result });
		});
		socket.on(Protocol.ChatMessage, p => {
			const senderId = p.readPrefixedUTF();
			const message = p.readPrefixedUTF();
			setMessages([...messages, { sender: senderId, message: message }]);
		});
		socket.on(Protocol.NoMoves, _ => setGameMessage({ msg: "You can't move so your opponent gets to move again", show: true, isError: false }));
		socket.on(Protocol.OpponentNoMoves, _ => setGameMessage({ msg: "Your opponent can't move, so it's your turn again", show: true, isError: false }));
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

			setProfiles(newProfiles);
		});
	}, [spectators, state]);

	useEffect(() => {
		if (!gameMessage.show) return;
		setTimeout(() => setGameMessage({...gameMessage, show: false}), 2000);
	}, [gameMessage]);

	const makeMove = (row: number, col: number) => {
		if (!state || !validSet.has(`${row},${col}`) || !yourTurn || state.status !== "ACTIVE") return;

		socket?.send(buildConsumeTurn(row, col));
	};

	const chat = (message: string) => {
		socket?.send(buildChat(message));
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
		chat
	};
}
