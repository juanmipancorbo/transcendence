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
let state = (0, game_1.createInitialGameState)('u1', 'u2');
let turnCount = 0;
console.log('=== FULL GAME TEST START ===');
(0, game_1.printBoard)(state.board);
console.log('status =>', state.status);
console.log('currentTurn =>', state.currentTurn);
while (state.status === 'ACTIVE') {
    const publicState = (0, game_1.getPublicGameState)(state);
    const validMoves = publicState.validMoves;
    assert(validMoves.length > 0, 'Active game with no valid moves');
    const move = validMoves[0];
    const userId = getCurrentUserId(state.currentTurn);
    console.log('\n--- turn', turnCount + 1, '---');
    console.log('player =>', state.currentTurn === game_1.BLACK ? 'BLACK' : 'WHITE');
    console.log('userId =>', userId);
    console.log('move =>', move);
    state = (0, game_1.applyPlayerMove)(state, userId, move.row, move.col);
    (0, game_1.printBoard)(state.board);
    console.log('status =>', state.status);
    console.log('currentTurn =>', state.currentTurn);
    console.log('winner =>', state.winner);
    turnCount++;
    assert(turnCount <= 200, 'Too many turns, possible infinite loop');
}
const pieces = (0, game_1.countPieces)(state.board);
console.log('\n=== FULL GAME TEST END ===');
console.log('final status =>', state.status);
console.log('winner =>', state.winner);
console.log('black =>', pieces.black);
console.log('white =>', pieces.white);
console.log('total turns =>', turnCount);
assert(state.status === 'FINISHED', 'Game did not finish correctly');
if (pieces.black > pieces.white)
    assert(state.winner === game_1.BLACK, 'Winner should be BLACK');
else if (pieces.white > pieces.black)
    assert(state.winner === game_1.WHITE, 'Winner should be WHITE');
else
    assert(state.winner === 'DRAW', 'Winner should be DRAW');
console.log('\nFull game test passed');
