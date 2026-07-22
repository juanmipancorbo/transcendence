"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = exports.SessionPlayer = exports.SESSIONS = void 0;
exports.createGameSession = createGameSession;
exports.restoreUnfinishedSessions = restoreUnfinishedSessions;
const crypto_1 = require("crypto");
const game_1 = require("../game");
const protocol_utils_1 = require("./protocol-utils");
const service_1 = require("@databaseAccess/game/service");
const service_2 = require("@databaseAccess/user/service");
const game_handler_1 = require("./handlers/game-handler");
const timers_1 = require("timers");
const repository_1 = require("@databaseAccess/game/repository");
exports.SESSIONS = new Map();
const RECONNECT_TIME_MS = 60000;
class SessionPlayer {
    constructor(id, timeLeft, game) {
        this.conn = new Set();
        this.ready = false;
        this.id = id;
        this.timeLeft = timeLeft;
        this.game = game;
    }
    isPlayerAlive(p) {
        for (const v of p.conn.values()) {
            if (v.isConnectionAlive())
                return true;
        }
        return false;
    }
    send(buf) {
        this.conn.forEach(c => c.send(buf));
    }
}
exports.SessionPlayer = SessionPlayer;
class GameSession {
    constructor(id, state, black, white, allowSpectators, friendly, timeLimit) {
        this.spectators = new Set();
        this.moves = [];
        this.messages = [];
        this.closing = false;
        this.id = id;
        this.state = state;
        this.allowSpectators = allowSpectators;
        this.friendly = friendly;
        this.timeLimit = timeLimit;
        this.blackPlayer = new SessionPlayer(black, timeLimit * 1000, this);
        this.whitePlayer = new SessionPlayer(white, timeLimit * 1000, this);
        this.blackPlayer.player = game_1.BLACK;
        this.whitePlayer.player = game_1.WHITE;
        this.state.blackPlayerId = black;
        this.state.whitePlayerId = white;
        this.state.status = game_1.STATUS_WAITING;
    }
    joinGameAsSpec(conn) {
        for (const s of this.spectators) {
            if (s.id === conn.id) {
                s.conn.add(conn);
                conn.player = s;
                this.spectators.forEach(existing => {
                    if (existing !== s)
                        conn.send((0, protocol_utils_1.buildSpectatorJoin)(existing.id));
                });
                return;
            }
        }
        this.spectators.forEach(existing => conn.send((0, protocol_utils_1.buildSpectatorJoin)(existing.id)));
        const player = new SessionPlayer(conn.id, -1, this);
        player.conn.add(conn);
        conn.player = player;
        this.spectators.add(player);
        this.broadcast((0, protocol_utils_1.buildSpectatorJoin)(conn.id));
    }
    broadcast(buf) {
        this.blackPlayer.conn.forEach(b => b.send(buf));
        this.whitePlayer.conn.forEach(w => w.send(buf));
        this.spectators.forEach(spec => spec.conn.forEach(conn => conn.send(buf)));
    }
    joinGame(conn) {
        var _a;
        if (this.state.status === game_1.STATUS_FINISHED || this.state.status === game_1.STATUS_ABANDONED)
            return new Error("Game has already ended");
        if (this.whitePlayer.id === conn.id) {
            this.whitePlayer.conn.add(conn);
            conn.player = this.whitePlayer;
        }
        else if (this.blackPlayer.id === conn.id) {
            this.blackPlayer.conn.add(conn);
            conn.player = this.blackPlayer;
        }
        else if (this.allowSpectators) {
            this.joinGameAsSpec(conn);
        }
        else
            return new Error("This game doesn't allow spectators");
        conn.send((0, protocol_utils_1.buildGameState)(this, (_a = conn.player.player) !== null && _a !== void 0 ? _a : 0));
    }
    clearSessionTimers() {
        if (this.blackPlayer.timeout)
            (0, timers_1.clearTimeout)(this.blackPlayer.timeout);
        if (this.whitePlayer.timeout)
            (0, timers_1.clearTimeout)(this.whitePlayer.timeout);
        if (this.blackAbandonTimer)
            (0, timers_1.clearTimeout)(this.blackAbandonTimer);
        if (this.whiteAbandonTimer)
            (0, timers_1.clearTimeout)(this.whiteAbandonTimer);
        this.blackPlayer.timeout = undefined;
        this.whitePlayer.timeout = undefined;
        this.blackAbandonTimer = undefined;
        this.whiteAbandonTimer = undefined;
    }
    releaseUserSockets(player) {
        player.conn.forEach(conn => conn.restoreGlobalState());
    }
    closeSession() {
        this.clearSessionTimers();
        exports.SESSIONS.delete(this.id);
        (0, service_2.clearUserGame)(this.blackPlayer.id).catch(e => console.error(e));
        (0, service_2.clearUserGame)(this.whitePlayer.id).catch(e => console.error(e));
        this.releaseUserSockets(this.blackPlayer);
        this.releaseUserSockets(this.whitePlayer);
        this.spectators.forEach(s => this.releaseUserSockets(s));
    }
    // Determines the winner, if no winner is set it stops the game with a draw
    reportFinished() {
        var _a;
        if (this.closing)
            return;
        this.closing = true;
        this.finishedAt = Date.now();
        const winner = this.state.winner !== null ?
            (this.state.winner === game_1.BLACK ?
                this.blackPlayer
                : this.whitePlayer)
            : null;
        (0, service_1.reportFinishedGame)(this.id, (_a = winner === null || winner === void 0 ? void 0 : winner.id) !== null && _a !== void 0 ? _a : null)
            .then(newXp => {
            if (winner && newXp !== null)
                winner.send((0, protocol_utils_1.buildXpUpdate)(newXp));
        })
            .catch(e => console.error(e))
            .finally(() => {
            this.broadcast((0, protocol_utils_1.buildGameEnd)(this));
            this.closeSession();
        });
    }
    playerReady(conn) {
        if (conn.player && !conn.player.ready) {
            conn.player.ready = true;
            const isPlayer = conn.player === this.blackPlayer || conn.player === this.whitePlayer;
            if (isPlayer && this.blackPlayer.ready && this.whitePlayer.ready) {
                this.state.status = game_1.STATUS_ACTIVE;
                this.broadcast((0, protocol_utils_1.build)(game_handler_1.Protocol.GameStart).freeze());
                this.startedAt = Math.floor(Date.now() / 1000);
                this.nextTurn();
            }
        }
        if (this.state.status === "ACTIVE") {
            if (this.blackAbandonTimer && this.blackPlayer.id === conn.id) {
                (0, timers_1.clearTimeout)(this.blackAbandonTimer);
                this.blackAbandonTimer = undefined;
                this.broadcast((0, protocol_utils_1.buildBlackReconnected)());
            }
            else if (this.whiteAbandonTimer && this.whitePlayer.id === conn.id) {
                (0, timers_1.clearTimeout)(this.whiteAbandonTimer);
                this.whiteAbandonTimer = undefined;
                this.broadcast((0, protocol_utils_1.buildWhiteReconnected)());
            }
        }
        const isSpectator = conn.player !== this.blackPlayer && conn.player !== this.whitePlayer;
        if (conn.player && isSpectator) {
            conn.send((0, protocol_utils_1.buildGameState)(this, 0));
        }
    }
    chat(sender, msg) {
        const output = (0, protocol_utils_1.buildChatMessage)(sender.id, msg);
        this.spectators.forEach(s => s.send(output));
        if (!this.spectators.has(sender)) {
            this.whitePlayer.send(output);
            this.blackPlayer.send(output);
        }
    }
    consumeTurn(conn, pos) {
        if (this.state.status !== "ACTIVE")
            return;
        if (this.state.currentTurn !== conn.player) {
            conn.send((0, protocol_utils_1.buildGameError)("It's not your turn"));
            return;
        }
        const previousBoard = this.state.board;
        if (this.timeLimit !== -1 && conn.timeout && conn.timer) {
            (0, timers_1.clearTimeout)(conn.timeout);
            conn.timeLeft -= Date.now() - conn.timer;
        }
        this.state = (0, game_1.applyPlayerMove)(this.state, conn.id, pos.row, pos.col);
        const updates = [];
        for (let i = 0; i < previousBoard.length; ++i) {
            for (let j = 0; j < previousBoard[i].length; ++j) {
                if (this.state.board[i][j] !== previousBoard[i][j])
                    updates.push({ content: this.state.board[i][j], pos: { row: i, col: j } });
            }
        }
        this.moves.push({ player: conn.player, pos, updates });
        // Send state updates to whole game
        this.broadcast((0, protocol_utils_1.buildMoveUpdate)(updates));
        if (this.state.status === game_1.STATUS_ACTIVE && conn.player === this.state.currentTurn) {
            this.broadcast(conn.player === game_1.BLACK ? (0, protocol_utils_1.buildWhiteNoMoves)() : (0, protocol_utils_1.buildBlackNoMoves)());
        }
        (0, service_1.addGameMovement)(this.id, conn.id, pos).catch(e => console.error(e));
        if (this.timeLimit !== -1)
            (0, service_1.setUserTimeLeft)(this.id, conn.id, conn.timeLeft).catch(e => console.error(e));
        this.nextTurn();
    }
    nextTurn() {
        if (this.state.status === game_1.STATUS_FINISHED || this.state.status === game_1.STATUS_ABANDONED)
            this.reportFinished();
        else if (this.state.currentTurn === game_1.BLACK) {
            let timeToLose = -1;
            if (this.timeLimit !== -1) {
                timeToLose = this.blackPlayer.timeLeft;
                this.blackPlayer.timer = Date.now();
                this.blackPlayer.timeout = setTimeout(() => {
                    this.state.winner = game_1.WHITE;
                    this.state.status = game_1.STATUS_FINISHED;
                    this.reportFinished();
                }, this.blackPlayer.timeLeft);
            }
            this.broadcast((0, protocol_utils_1.buildBlackTurn)((0, game_1.getValidMoves)(this.state.board, game_1.BLACK), timeToLose));
        }
        else if (this.state.currentTurn === game_1.WHITE) {
            let timeToLose;
            if (this.timeLimit !== -1) {
                timeToLose = this.whitePlayer.timeLeft;
                this.whitePlayer.timer = Date.now();
                this.whitePlayer.timeout = setTimeout(() => {
                    this.state.winner = game_1.BLACK;
                    this.state.status = game_1.STATUS_FINISHED;
                    this.reportFinished();
                }, this.whitePlayer.timeLeft);
            }
            else
                timeToLose = -1;
            this.broadcast((0, protocol_utils_1.buildWhiteTurn)((0, game_1.getValidMoves)(this.state.board, game_1.WHITE), timeToLose));
        }
    }
    abandon(conn) {
        if (this.state.status !== "FINISHED") {
            this.state = (0, game_1.abandonGame)(this.state, conn.id);
            if (this.blackPlayer.id === conn.id)
                this.broadcast((0, protocol_utils_1.buildBlackAbandon)());
            else if (this.whitePlayer.id === conn.id)
                this.broadcast((0, protocol_utils_1.buildWhiteAbandon)());
            this.reportFinished();
        }
    }
    playerAbandon(conn) {
        // Remove spectator
        for (const spec of this.spectators) {
            if (spec.id === conn.id && spec.conn.has(conn)) {
                this.broadcast((0, protocol_utils_1.buildSpectatorLeave)(spec.id));
                this.spectators.delete(spec);
                conn.restoreGlobalState();
                return;
            }
        }
        this.abandon(conn);
    }
    playerDisconnect(conn) {
        // Remove spectator
        for (const spec of this.spectators) {
            if (spec.id === conn.id && spec.conn.has(conn)) {
                if (spec.conn.size === 1) {
                    this.broadcast((0, protocol_utils_1.buildSpectatorLeave)(spec.id));
                    this.spectators.delete(spec);
                }
                spec.conn.delete(conn);
                conn.restoreGlobalState();
                return;
            }
        }
        if (conn.id === this.blackPlayer.id && this.blackPlayer.conn.delete(conn) && this.blackPlayer.conn.size === 0) {
            this.broadcast((0, protocol_utils_1.buildBlackDisconnect)(RECONNECT_TIME_MS));
            this.blackAbandonTimer = setTimeout(() => this.abandon(conn), RECONNECT_TIME_MS);
        }
        else if (conn.id === this.whitePlayer.id && this.whitePlayer.conn.delete(conn) && this.whitePlayer.conn.size === 0) {
            this.broadcast((0, protocol_utils_1.buildWhiteDisconnect)(RECONNECT_TIME_MS));
            this.whiteAbandonTimer = setTimeout(() => this.abandon(conn), RECONNECT_TIME_MS);
        }
        conn.restoreGlobalState();
    }
}
exports.GameSession = GameSession;
/**
* Create a game session and store it in SESSIONS
* timeLimit set to -1 for unlimited time.
*/
function createGameSession(white, black, allowSpectators, friendly, timeLimit) {
    const game = new GameSession((0, crypto_1.randomUUID)(), (0, game_1.createInitialGameState)(), black, white, allowSpectators, friendly, timeLimit);
    exports.SESSIONS.set(game.id, game);
    (0, service_1.createGame)({
        gameId: game.id,
        whiteId: white,
        blackId: black,
        timeLimit: game.timeLimit,
        allowSpectators: game.allowSpectators,
        friendly
    }).then(() => Promise.all([
        (0, service_2.updateUserGame)(white, game.id),
        (0, service_2.updateUserGame)(black, game.id),
    ])).catch(e => console.error(e));
    return game;
}
function restoreUnfinishedSessions() {
    console.log("Restoring unfinished games...");
    (0, repository_1.getUnfinishedGames)().then(games => games.forEach(game => {
        let state = (0, game_1.createInitialGameState)(game.black_player_id, game.white_player_id);
        for (const move of game.moves) {
            const player = move.player === game_1.BLACK ? game.black_player_id : game.white_player_id;
            state = (0, game_1.applyPlayerMove)(state, player, move.row, move.col);
        }
        const session = new GameSession(game.id, state, game.black_player_id, game.white_player_id, game.allow_spectators, game.friendly, Math.max(game.time_left_black, game.time_left_white));
        session.blackPlayer.timeLeft = game.time_left_black;
        session.whitePlayer.timeLeft = game.time_left_white;
        exports.SESSIONS.set(game.id, session);
        // Delete a stale session that players don't agree on joining after a reasonable time
        setTimeout(() => {
            if (exports.SESSIONS.has(game.id))
                session.reportFinished();
        }, 600000 + game.time_left_white + game.time_left_black);
    })).catch(e => console.error(e));
}
