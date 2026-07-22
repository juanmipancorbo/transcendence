"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
function assert(condition, message) {
    if (!condition)
        throw new Error(message);
}
function getCurrentUserId(currentTurn) {
    return (currentTurn === game_1.BLACK ? 'u1' : 'u2');
}
function getRandomInt(max) {
    return (Math.floor(Math.random() * max));
}
function winnerMatchesCount(black, white, winner) {
    if (black > white)
        return (winner === game_1.BLACK);
    if (white > black)
        return (winner === game_1.WHITE);
    return (winner === 'DRAW');
}
function runSingleGame(gameIndex) {
    let state = (0, game_1.createInitialGameState)('u1', 'u2');
    let turnCount = 0;
    while (state.status === 'ACTIVE') {
        const publicState = (0, game_1.getPublicGameState)(state);
        const validMoves = publicState.validMoves;
        assert(validMoves.length > 0, `Game ${gameIndex}: active game with no valid moves`);
        const randomMove = validMoves[getRandomInt(validMoves.length)];
        const userId = getCurrentUserId(state.currentTurn);
        state = (0, game_1.applyPlayerMove)(state, userId, randomMove.row, randomMove.col);
        turnCount++;
        assert(turnCount <= 200, `Game ${gameIndex}: too many turns`);
    }
    const pieces = (0, game_1.countPieces)(state.board);
    const totalPieces = pieces.black + pieces.white;
    assert(state.status === 'FINISHED', `Game ${gameIndex}: game did not finish`);
    assert(totalPieces <= 64, `Game ${gameIndex}: too many pieces on board`);
    assert(winnerMatchesCount(pieces.black, pieces.white, state.winner), `Game ${gameIndex}: winner does not match piece count`);
}
const TOTAL_GAMES = 1000;
console.log(`Starting stress test with ${TOTAL_GAMES} games...`);
for (let i = 0; i < TOTAL_GAMES; i++) {
    runSingleGame(i + 1);
    if ((i + 1) % 10 === 0)
        console.log(`Completed ${i + 1}/${TOTAL_GAMES} games`);
}
console.log('Stress test passed');
