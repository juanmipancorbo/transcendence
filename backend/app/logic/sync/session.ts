import { randomUUID, UUID } from "crypto";
import { abandonGame, applyPlayerMove, BLACK, Cell, createInitialGameState, GameState, getValidMoves, Player, Position, STATUS_ABANDONED, STATUS_ACTIVE, STATUS_FINISHED, STATUS_WAITING, WHITE } from "../game";
import { Socket } from "./socket";
import { build, buildChatMessage, buildGameEnd, buildGameError, buildGameState, buildMoveUpdate, buildOpponentAbandon, buildOpponentTurn, buildSpectatorJoin, buildSpectatorLeave, buildYourTurn } from "./protocol-utils";
import { addGameMovement, createGame, setFinished, setUserTimeLeft, setWinner } from "../../src/database/game/service";
import { updateUserGame, updateUserGameNull } from "../../src/database/user/service";
import { quickplay, unsetQuickplay } from "../../websockets";
import { Protocol as GameProtocol }  from "./handlers/game-handler";

export const SESSIONS: Map<UUID, GameSession> = new Map();

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
	timeLimit: number; // In seconds, -1 for unlimited
	moves: PlayerMove[] = [];
	messages: Message[] = [];
	startedAt?: number;
	finishedAt?: number;

	constructor(
		id: UUID,
		state: GameState,
		black: UUID,
		white: UUID,
		allowSpectators: boolean,
		timeLimit: number
	) {
		this.id = id;
		this.state = state;
		this.allowSpectators = allowSpectators;
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
		this.broadcast(buildSpectatorJoin(conn.id));
		const player = new SessionPlayer(conn.id, -1, this);
		conn.player = player;
		this.spectators.add(player);
	}

	broadcast(buf: BufferSource) {
		this.blackPlayer.conn.forEach(b => b.send(buf));
		this.whitePlayer.conn.forEach(w => w.send(buf));
		this.spectators.forEach(spec => spec.conn.forEach(conn => conn.send(buf)));
	}

	joinGame(conn: Socket): void | Error {
		if (this.whitePlayer.id === conn.id) {
			this.whitePlayer.conn.add(conn);
			conn.player = this.whitePlayer;
		} else if (this.blackPlayer.id === conn.id) {
			this.blackPlayer.conn.add(conn);
			conn.player = this.blackPlayer;
		} else if (this.allowSpectators) {
			this.joinGameAsSpec(conn);
		} else return new Error("This game doesn't allow spectators");
		conn.send(buildGameState(this, (conn.player as SessionPlayer).player as Player))
	}

	closeSession() {
		SESSIONS.delete(this.id);
		this.blackPlayer.conn.forEach(c => c.close());
		this.whitePlayer.conn.forEach(c => c.close());
		this.spectators.forEach(s => s.conn.forEach(c => c.close()));
	}

	// Determines the winner, if no winner is set it stops the game with a draw
	reportFinished() {
		this.finishedAt = Date.now();
		this.broadcast(buildGameEnd(this));

		// TODO: Save and if leaderboard or exp systems, add something here
		if (this.state.winner === BLACK)
			setWinner({ gameId: this.id, winnerId: this.blackPlayer.id }).catch(e => console.error(e));
		else if (this.state.winner === WHITE)
			setWinner({ gameId: this.id, winnerId: this.whitePlayer.id }).catch(e => console.error(e));
		setFinished(this.id).catch(e => console.error(e));
		updateUserGameNull(this.whitePlayer.id).catch(e => console.error(e));
		updateUserGameNull(this.blackPlayer.id).catch(e => console.error(e));
		this.closeSession();
	}

	playerReady(conn: SessionPlayer) {
		if (!conn.ready) {
			conn.ready = true;
			if (this.blackPlayer.ready && this.whitePlayer.ready) {
				this.state.status = STATUS_ACTIVE;
				this.broadcast(build(GameProtocol.GameStart).freeze());
				this.startedAt = Date.now();
				this.nextTurn();
			}
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

		const opponent = conn.player === BLACK ? this.whitePlayer : this.blackPlayer;
		conn.send(build(GameProtocol.OpponentNoMoves).freeze());
		opponent.send(build(GameProtocol.NoMoves).freeze());
		addGameMovement(this.id, conn.id, pos, updates).catch(e => console.error(e));
		if (this.timeLimit !== -1)
			setUserTimeLeft(this.id, conn.id, conn.timeLeft).catch(e => console.error(e));

		this.nextTurn();
	}

	private nextTurn() {
		if (this.state.status === STATUS_FINISHED || this.state.status === STATUS_ABANDONED)
			this.reportFinished();
		else if (this.state.currentTurn === BLACK) {
			let timeToLose = -1;
			this.whitePlayer.send(buildOpponentTurn(this.whitePlayer.timeLeft));

			if (this.timeLimit !== -1) {
				timeToLose = this.blackPlayer.timeLeft;
				this.blackPlayer.timer = Date.now();
				this.blackPlayer.timeout = setTimeout(() => {
					this.state.winner = WHITE;
					this.state.status = STATUS_FINISHED;

					this.reportFinished();
				}, this.blackPlayer.timeLeft);
			}

			this.blackPlayer.send(buildYourTurn(getValidMoves(this.state.board, BLACK), timeToLose));
		} else if (this.state.currentTurn === WHITE) {
			let timeToLose;
			this.blackPlayer.send(buildOpponentTurn(this.blackPlayer.timeLeft));

			if (this.timeLimit !== -1) {
				timeToLose = this.whitePlayer.timeLeft;
				this.whitePlayer.timer = Date.now();
				this.whitePlayer.timeout = setTimeout(() => {
					this.state.winner = BLACK;
					this.state.status = STATUS_FINISHED;
					this.reportFinished();
				}, this.whitePlayer.timeLeft);
			} else timeToLose = -1;

			this.whitePlayer.send(buildYourTurn(getValidMoves(this.state.board, WHITE), timeToLose));
		}
	}

	private abandon(conn: Socket) {
		if (this.state.status !== "FINISHED") {
			abandonGame(this.state, conn.id);
			if (this.blackPlayer.id === conn.id)
				this.whitePlayer.send(buildOpponentAbandon())
			else if (this.whitePlayer.id === conn.id)
				this.blackPlayer.send(buildOpponentAbandon())
		}
	}

	playerAbandon(conn: Socket) {
		// Remove spectator
		for (const spec of this.spectators) {
			if (spec.id === conn.id && spec.conn.has(conn)) {
				this.broadcast(buildSpectatorLeave(spec.id));
				this.spectators.delete(spec);
				return;
			}
		}
		this.abandon(conn);
		if (quickplay && quickplay.id === conn.id)
			unsetQuickplay();
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
				return;
			}
		}

		let player = this.blackPlayer.id === conn.id ? this.blackPlayer : this.whitePlayer.id === conn.id ? this.whitePlayer : null;
		if (player && player.conn.delete(conn) && player.conn.size === 0)
			this.abandon(conn);
		if (quickplay && quickplay.id === conn.id)
			unsetQuickplay();
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
	timeLimit: number
): GameSession {
	const game: GameSession = new GameSession(randomUUID(), createInitialGameState(), black, white, allowSpectators, timeLimit);
	createGame({
		gameId: game.id,
		whiteId: white,
		blackId: black,
		timeLimit: game.timeLimit,
		allowSpectators: game.allowSpectators
	}).catch(e => console.error(e));

	SESSIONS.set(game.id, game);
	updateUserGame(white, game.id, game.timeLimit).catch(e => console.error(e));
	updateUserGame(black, game.id, game.timeLimit).catch(e => console.error(e));

	return game;
}
