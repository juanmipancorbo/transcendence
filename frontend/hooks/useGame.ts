"use client";

import { useEffect, useState } from "react";
import { type GameState, PreGameProtocol, BLACK, Protocol, WHITE, PlayerColor, GameStatus, Board, User } from "@/types";
import { GameSocket } from "@/lib/ws/socket";
import { WS_URL } from "@/lib/config";
import { buildReadyToGame } from "@/lib/ws/stream-utils";
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

export function useGame(id: string, onJoin: (session: GameState | Error) => void) {
	const [socket, setSocket] = useState<GameSocket | null>(null);
	const [state, setState] = useState<GameState | null>(null);
	const [yourTurn, setYourTurn] = useState<boolean>(false);
	const [opponentTurn, setOpponentTurn] = useState<boolean>(false);
	const [spectators, setSpectators] = useState<string[]>([]);
	const [profiles, setProfiles] = useState(new Map<string, Pick<User, "xp" | "rank" | "wins" | "username" | "avatarUrl" | "displayName">>());
	const [gameMessage, setGameMessage] = useState({ msg: "", show: false });

	useEffect(() => {
		const socket = new GameSocket(WS_URL + `/matches/join?gameId=${id}`, (e) => {
			if (e) {
				onJoin(e);
				return;
			}

			setSocket(socket);
		});
		socket.on(Protocol.State, payload => {
			const id = payload.readPrefixedUTF();
			const board = payload.readBoard();
const as = payload.readUint8();
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

			// Game socket setup start
			socket.on(Protocol.OpponentAbandon, p => {});
			socket.on(Protocol.SpectatorJoin, p => {});
			socket.on(Protocol.SpectatorLeave, p => {});
			socket.on(Protocol.Error, p => {});
			socket.on(Protocol.Board, p => {});
			socket.on(Protocol.MoveUpdate, p => {});
			socket.on(Protocol.YourTurn, p => {});
			socket.on(Protocol.OpponentTurn, p => {});
			socket.on(Protocol.GameStart, p => {});
			socket.on(Protocol.GameEnd, p => {});
			socket.on(Protocol.ChatMessage, p => {});
			socket.on(Protocol.NoMoves, p => {});
			socket.on(Protocol.OpponentNoMoves, p => {});
			// Game socket setup end

			socket.send(buildReadyToGame()); // Notify the backend this player is ready
		});

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
		// TODO: socket.send("make_move", { row, col })
		console.log("[useGame] move stub →", row, col);
	};

	return {
		socket,
		state,
		yourTurn,
		gameMessage,
		opponentTurn,
		makeMove,
	};
}
