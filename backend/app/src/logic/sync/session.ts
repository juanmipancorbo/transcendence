import { randomUUID, UUID } from "crypto";
import { abandonGame, applyPlayerMove, BLACK, Cell, createInitialGameState, GameState, getValidMoves, Player, Position, STATUS_ABANDONED, STATUS_ACTIVE, STATUS_FINISHED, STATUS_WAITING, WHITE } from "../game";
import { getSocksById, Socket } from "./socket";
import { build, buildBlackAbandon, buildBlackDisconnect, buildBlackNoMoves, buildBlackReconnected, buildBlackTurn, buildChatMessage, buildGameEnd, buildGameError, buildGameState, buildMoveUpdate, buildSpectatorJoin, buildSpectatorLeave, buildWhiteAbandon, buildWhiteDisconnect, buildWhiteNoMoves, buildWhiteReconnected, buildWhiteTurn, buildXpUpdate } from "./protocol-utils";
import { addGameMovement, createGame, reportFinishedGame, setUserTimeLeft } from "@databaseAccess/game/service";
import { updateUserGame, clearUserGame } from "@databaseAccess/user/service";
import { Protocol as GameProtocol }  from "./handlers/game-handler";
import { clearTimeout } from "timers";
import globalHandler from "./handlers/global-handler";
import { getUnfinishedGames } from "@databaseAccess/game/repository";

export const SESSIONS: Map<UUID, GameSession> = new Map();

const RECONNECT_TIME_MS = 60000;

/**
* @content the new content
* @pos where in the board
*/
export type PositionUpdate = {
	content: Cell,
	pos: Position
}

/**
* @player the player that moved
* @pos where the player issued the move
* @updates the changes in board that this move provoked
*/
export type PlayerMove = {
	player: Player,
	pos: Position,
	updates: PositionUpdate[]
}

export type Message = {
	source: UUID,
	content: string
}

export class SessionPlayer {
	conn: Set<Socket> = new Set();
	game: GameSession;
	player?: Player;
	ready: boolean = false;
	timeLeft: number;
	timer?: number | null;
	timeout?: NodeJS.Timeout | null;
	id: UUID;

	constructor(id: UUID, timeLeft: number, game: GameSession) {
		this.id = id;
		this.timeLeft = timeLeft;
		this.game = game;
	}

	isPlayerAlive(p: SessionPlayer): boolean {
		for (const v of p.conn.values()) {
			if (v.isConnectionAlive())
				return true;
		}
		return false;
	}

	send(buf: BufferSource) {
		this.conn.forEach(c => c.send(buf));
	}
}

export class GameSession {
	id: UUID;
	state: GameState;
	blackPlayer: SessionPlayer;
	whitePlayer: SessionPlayer;
	spectators: Set<SessionPlayer> = new Set();
	allowSpectators: boolean;
	friendly: boolean;
	timeLimit: number; // In seconds, -1 for unlimited
	moves: PlayerMove[] = [];
	messages: Message[] = [];
	startedAt?: number;
	finishedAt?: number;
	blackAbandonTimer?: NodeJS.Timeout;
	whiteAbandonTimer?: NodeJS.Timeout;
	private closing = false;

	constructor(
		id: UUID,
		state: GameState,
		black: UUID,
		white: UUID,
		allowSpectators: boolean,
		friendly: boolean,
		timeLimit: number
	) {
		this.id = id;
		this.state = state;
		this.allowSpectators = allowSpectators;
		this.friendly = friendly;
		this.timeLimit = timeLimit;
		this.blackPlayer = new SessionPlayer(black, timeLimit * 1000, this);
		this.whitePlayer = new SessionPlayer(white, timeLimit * 1000, this);
		this.blackPlayer.player = BLACK;
		this.whitePlayer.player = WHITE;

		this.state.blackPlayerId = black;
		this.state.whitePlayerId = white;
		this.state.status = STATUS_WAITING
	}

	private joinGameAsSpec(conn: Socket) {
		for (const s of this.spectators) {
			if (s.id === conn.id) {
				s.conn.add(conn);
				conn.player = s;
				return;
			}
		}
		const player = new SessionPlayer(conn.id, -1, this);
		player.conn.add(conn);
		conn.player = player;
		this.spectators.add(player);
		this.broadcast(buildSpectatorJoin(conn.id));
	}

	broadcast(buf: BufferSource) {
		this.blackPlayer.conn.forEach(b => b.send(buf));
		this.whitePlayer.conn.forEach(w => w.send(buf));
		this.spectators.forEach(spec => spec.conn.forEach(conn => conn.send(buf)));
	}

	joinGame(conn: Socket): void | Error {
		if (this.state.status === STATUS_FINISHED || this.state.status === STATUS_ABANDONED)
			return new Error("Game has already ended");
		if (this.whitePlayer.id === conn.id) {
			this.whitePlayer.conn.add(conn);
			conn.player = this.whitePlayer;
		} else if (this.blackPlayer.id === conn.id) {
			this.blackPlayer.conn.add(conn);
			conn.player = this.blackPlayer;
		} else if (this.allowSpectators) {
			this.joinGameAsSpec(conn);
		} else return new Error("This game doesn't allow spectators");
		conn.send(buildGameState(this, (conn.player as SessionPlayer).player ?? 0));
	}

	private clearSessionTimers() {
		if (this.blackPlayer.timeout) clearTimeout(this.blackPlayer.timeout);
		if (this.whitePlayer.timeout) clearTimeout(this.whitePlayer.timeout);
		if (this.blackAbandonTimer) clearTimeout(this.blackAbandonTimer);
		if (this.whiteAbandonTimer) clearTimeout(this.whiteAbandonTimer);
		this.blackPlayer.timeout = undefined;
		this.whitePlayer.timeout = undefined;
		this.blackAbandonTimer = undefined;
		this.whiteAbandonTimer = undefined;
	}

	private releaseUserSockets(id: UUID) {
		getSocksById(id)?.forEach(conn => {
			conn.handler = globalHandler;
			conn.status = "online";
			conn.player = undefined;
		});
	}

	closeSession() {
		this.clearSessionTimers();
		SESSIONS.delete(this.id);
		clearUserGame(this.blackPlayer.id).catch(e => console.error(e));
		clearUserGame(this.whitePlayer.id).catch(e => console.error(e));
		this.releaseUserSockets(this.blackPlayer.id);
		this.releaseUserSockets(this.whitePlayer.id);
		this.spectators.forEach(s => s.conn.forEach(c => {
			c.handler = globalHandler;
			c.status = "online";
			c.player = undefined;
		}));
	}

	// Determines the winner, if no winner is set it stops the game with a draw
	reportFinished() {
		if (this.closing) return;
		this.closing = true;
		this.clearSessionTimers();
		this.finishedAt = Date.now();
		const winner = this.state.winner !== null ?
			(this.state.winner === BLACK ?
				this.blackPlayer
				: this.whitePlayer)
			: null;

		reportFinishedGame(this.id, winner?.id ?? null)
			.then(newXp => {
				if (winner && newXp !== null) winner.send(buildXpUpdate(newXp));
			})
			.catch(e => console.error(e))
			.finally(() => {
				this.broadcast(buildGameEnd(this));
				this.closeSession();
			});
	}

	playerReady(conn: Socket) {
		if (conn.player && !conn.player.ready) {
			conn.player.ready = true;
			const isPlayer = conn.player === this.blackPlayer || conn.player === this.whitePlayer;
			if (isPlayer && this.blackPlayer.ready && this.whitePlayer.ready) {
				this.state.status = STATUS_ACTIVE;
				this.broadcast(build(GameProtocol.GameStart).freeze());
				this.startedAt = Math.floor(Date.now() / 1000);
				this.nextTurn();
			}
		}
		if (this.state.status === "ACTIVE") {
			if (this.blackAbandonTimer && this.blackPlayer.id === conn.id) {
				clearTimeout(this.blackAbandonTimer);
				this.blackAbandonTimer = undefined;
				this.broadcast(buildBlackReconnected());
			} else if (this.whiteAbandonTimer && this.whitePlayer.id === conn.id) {
				clearTimeout(this.whiteAbandonTimer);
				this.whiteAbandonTimer = undefined;
				this.broadcast(buildWhiteReconnected());
			}
		}
		const isSpectator = conn.player !== this.blackPlayer && conn.player !== this.whitePlayer;
		if (conn.player && isSpectator) {
			conn.send(buildGameState(this, 0));
		}
	}

	chat(sender: SessionPlayer, msg: string) {
		const output = buildChatMessage(sender.id, msg);
		this.spectators.forEach(s => s.send(output));

		if (!this.spectators.has(sender)) {
			this.whitePlayer.send(output);
			this.blackPlayer.send(output);
		}
	}

	consumeTurn(conn: SessionPlayer, pos: Position) {
		if (this.state.currentTurn !== conn.player) {
			conn.send(buildGameError("It's not your turn"));
			return;
		}

		const previousBoard = this.state.board;
		if (this.timeLimit !== -1 && conn.timeout && conn.timer) {
			clearTimeout(conn.timeout);
			conn.timeLeft -= Date.now() - conn.timer;
		}
		this.state = applyPlayerMove(this.state, conn.id, pos.row, pos.col);

		const updates: PositionUpdate[] = [];

		for (let i = 0; i < previousBoard.length; ++i) {
			for (let j = 0; j < previousBoard[i].length; ++j) {
				if (this.state.board[i][j] !== previousBoard[i][j])
					updates.push({ content: this.state.board[i][j], pos: { row: i, col: j } });
			}
		}
		this.moves.push({ player: conn.player, pos, updates });

		// Send state updates to whole game
		this.broadcast(buildMoveUpdate(updates));

		if (conn.player === this.state.currentTurn) {
			this.broadcast(conn.player === BLACK ? buildWhiteNoMoves() : buildBlackNoMoves());
		}
		addGameMovement(this.id, conn.id, pos).catch(e => console.error(e));
		if (this.timeLimit !== -1)
			setUserTimeLeft(this.id, conn.id, conn.timeLeft).catch(e => console.error(e));

		this.nextTurn();
	}

	private nextTurn() {
		if (this.state.status === STATUS_FINISHED || this.state.status === STATUS_ABANDONED)
			this.reportFinished();
		else if (this.state.currentTurn === BLACK) {
			let timeToLose = -1;

			if (this.timeLimit !== -1) {
				timeToLose = this.blackPlayer.timeLeft;
				this.blackPlayer.timer = Date.now();
				this.blackPlayer.timeout = setTimeout(() => {
					this.state.winner = WHITE;
					this.state.status = STATUS_FINISHED;

					this.reportFinished();
				}, this.blackPlayer.timeLeft);
			}

			this.broadcast(buildBlackTurn(getValidMoves(this.state.board, BLACK), timeToLose));
		} else if (this.state.currentTurn === WHITE) {
			let timeToLose;

			if (this.timeLimit !== -1) {
				timeToLose = this.whitePlayer.timeLeft;
				this.whitePlayer.timer = Date.now();
				this.whitePlayer.timeout = setTimeout(() => {
					this.state.winner = BLACK;
					this.state.status = STATUS_FINISHED;
					this.reportFinished();
				}, this.whitePlayer.timeLeft);
			} else timeToLose = -1;

			this.broadcast(buildWhiteTurn(getValidMoves(this.state.board, WHITE), timeToLose));
		}
	}

	private abandon(conn: Socket) {
		if (this.state.status !== "FINISHED") {
			this.state = abandonGame(this.state, conn.id);
			if (this.blackPlayer.id === conn.id)
				this.broadcast(buildBlackAbandon());
			else if (this.whitePlayer.id === conn.id)
				this.broadcast(buildWhiteAbandon())
			this.reportFinished();
		}
	}

	playerAbandon(conn: Socket) {
		// Remove spectator
		for (const spec of this.spectators) {
			if (spec.id === conn.id && spec.conn.has(conn)) {
				this.broadcast(buildSpectatorLeave(spec.id));
				this.spectators.delete(spec);
				conn.handler = globalHandler;
				conn.status = "online";
				conn.player = undefined;
				return;
			}
		}
		this.abandon(conn);
	}

	playerDisconnect(conn: Socket) {
		// Remove spectator
		for (const spec of this.spectators) {
			if (spec.id === conn.id && spec.conn.has(conn)) {
				if (spec.conn.size === 1) {
					this.broadcast(buildSpectatorLeave(spec.id));
					this.spectators.delete(spec);
				}
				spec.conn.delete(conn);
				conn.handler = globalHandler;
				conn.status = "online";
				conn.player = undefined;
				return;
			}
		}

		if (conn.id === this.blackPlayer.id && this.blackPlayer.conn.delete(conn) && this.blackPlayer.conn.size === 0) {
			this.broadcast(buildBlackDisconnect(RECONNECT_TIME_MS));
			this.blackAbandonTimer = setTimeout(() => this.abandon(conn), RECONNECT_TIME_MS);
		} else if (conn.id === this.whitePlayer.id && this.whitePlayer.conn.delete(conn) && this.whitePlayer.conn.size === 0) {
			this.broadcast(buildWhiteDisconnect(RECONNECT_TIME_MS));
			this.whiteAbandonTimer = setTimeout(() => this.abandon(conn), RECONNECT_TIME_MS);
		}
		conn.handler = globalHandler;
		conn.status = "busy";
		conn.player = undefined;
	}
}

/**
* Create a game session and store it in SESSIONS
* timeLimit set to -1 for unlimited time.
*/
export function createGameSession(
	white: UUID,
	black: UUID,
	allowSpectators: boolean,
	friendly: boolean,
	timeLimit: number
): GameSession {
	const game: GameSession = new GameSession(randomUUID(), createInitialGameState(), black, white, allowSpectators, friendly, timeLimit);
	SESSIONS.set(game.id, game);
	createGame({
		gameId: game.id,
		whiteId: white,
		blackId: black,
		timeLimit: game.timeLimit,
		allowSpectators: game.allowSpectators,
		friendly
	}).then(() => Promise.all([
		updateUserGame(white, game.id),
		updateUserGame(black, game.id),
	])).catch(e => console.error(e));

	return game;
}

export function restoreUnfinishedSessions() {
	console.log("Restoring unfinished games...")
	getUnfinishedGames().then(games => games.forEach(game => {
		let state = createInitialGameState(game.black_player_id, game.white_player_id);

		for (const move of game.moves) {
			const player = move.player === BLACK ? game.black_player_id : game.white_player_id;
			state = applyPlayerMove(state, player, move.row, move.col);
		}

		const session = new GameSession(
			game.id as UUID,
			state,
			game.black_player_id as UUID,
			game.white_player_id as UUID,
			game.allow_spectators,
			game.friendly,
			Math.max(game.time_left_black, game.time_left_white)
		);
		session.blackPlayer.timeLeft = game.time_left_black;
		session.whitePlayer.timeLeft = game.time_left_white;

		SESSIONS.set(game.id as UUID, session);

		// Delete a stale session that players don't agree on joining after a reasonable time
		setTimeout(() => {
			if (SESSIONS.has(game.id as UUID))
				session.reportFinished();
		}, 600000 + game.time_left_white + game.time_left_black);
	})).catch(e => console.error(e));
}
