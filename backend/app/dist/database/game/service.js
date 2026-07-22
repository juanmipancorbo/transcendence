"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readGame = readGame;
exports.createGame = createGame;
exports.updateUserTimer = updateUserTimer;
exports.addGameMovement = addGameMovement;
exports.setUserTimeLeft = setUserTimeLeft;
exports.reportFinishedGame = reportFinishedGame;
exports.readCompletedGame = readCompletedGame;
exports.setWinner = setWinner;
const game_1 = require("@gameLogic/game");
const Repo = __importStar(require("./repository"));
const error_1 = require("@utils/error");
const pg_1 = require("pg");
function readGame(gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const game = yield Repo.selectGame(gameId);
        if (!game)
            throw (new error_1.ApiError("Game not found", 404));
        return (game);
    });
}
function createGame(_a) {
    return __awaiter(this, arguments, void 0, function* ({ gameId, whiteId, blackId, timeLimit, allowSpectators, friendly }) {
        try {
            yield Repo.insertGame(gameId, whiteId, blackId, friendly, timeLimit, allowSpectators);
        }
        catch (err) {
            if (!(err instanceof pg_1.DatabaseError) || err.code !== "23505")
                throw err;
            throw (new error_1.ApiError(`Failed to create game: Database: ${err.message}`, 409));
        }
    });
}
function updateUserTimer(gameId, userId, timeLeft) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.updateUserTimer(gameId, userId, timeLeft);
    });
}
function addGameMovement(gameId, userId, pos) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.addGameMovement(gameId, userId, pos.row, pos.col);
    });
}
function setUserTimeLeft(gameId, userId, timeLeft) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.updateUserTimer(gameId, userId, timeLeft);
    });
}
function reportFinishedGame(gameId, winnerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.reportFinishedGame(gameId, winnerId);
    });
}
function readCompletedGame(gameId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const game = yield Repo.selectCompletedGame(gameId, userId);
        if (!game)
            throw new error_1.ApiError("Completed game not found", 404);
        let state = (0, game_1.createInitialGameState)(game.black_player_id, game.white_player_id);
        for (const move of game.moves) {
            const playerId = move.player === game_1.BLACK ? game.black_player_id : game.white_player_id;
            state = (0, game_1.applyPlayerMove)(state, playerId, move.row, move.col);
        }
        const scores = (0, game_1.countPieces)(state.board);
        const winner = game.winner_id === game.black_player_id
            ? game_1.BLACK
            : game.winner_id === game.white_player_id ? game_1.WHITE : 0;
        return {
            gameId: game.id,
            whiteId: game.white_player_id,
            blackId: game.black_player_id,
            winner,
            board: state.board,
            scores,
            finishedAt: game.finished_at,
        };
    });
}
function setWinner(_a) {
    return __awaiter(this, arguments, void 0, function* ({ gameId, winnerId }) {
        const game = yield Repo.selectGame(gameId);
        if (!game)
            throw (new error_1.ApiError("Game not found", 404));
        if (winnerId !== game.blackId && winnerId !== game.whiteId)
            throw (new error_1.ApiError("Ivalid player ID for this game", 403));
        yield Repo.updateGameWinner(game.gameId, winnerId);
    });
}
