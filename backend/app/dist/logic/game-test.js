"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
function separator(title) {
    console.log('\n=== ' + title + ' ===');
}
separator('initial state status');
console.log('without players =>', (0, game_1.createInitialGameState)().status);
console.log('with players =>', (0, game_1.createInitialGameState)('u1', 'u2').status);
const state = (0, game_1.createInitialGameState)('u1', 'u2');
separator('initial board');
(0, game_1.printBoard)(state.board);
separator('player mapping');
console.log('u1 =>', (0, game_1.getPlayerByUserId)(state, 'u1'));
console.log('u2 =>', (0, game_1.getPlayerByUserId)(state, 'u2'));
console.log('u3 =>', (0, game_1.getPlayerByUserId)(state, 'u3'));
separator('turn check');
console.log('is u1 turn?', (0, game_1.isPlayersTurn)(state, 'u1'));
console.log('is u2 turn?', (0, game_1.isPlayersTurn)(state, 'u2'));
separator('valid moves');
console.log('BLACK valid moves:', (0, game_1.getValidMoves)(state.board, game_1.BLACK));
console.log('WHITE valid moves:', (0, game_1.getValidMoves)(state.board, game_1.WHITE));
separator('public game state');
const publicState = (0, game_1.getPublicGameState)(state);
console.log('currentTurn =>', publicState.currentTurn);
console.log('validMoves =>', publicState.validMoves);
separator('apply valid move from u1');
const nextState = (0, game_1.applyPlayerMove)(state, 'u1', 2, 3);
(0, game_1.printBoard)(nextState.board);
console.log('currentTurn =>', nextState.currentTurn);
separator('reject wrong turn');
try {
    (0, game_1.applyPlayerMove)(state, 'u2', 2, 3);
    console.log('ERROR: this should have failed');
}
catch (error) {
    if (error instanceof Error)
        console.log(error.message);
}
separator('reject user not in game');
try {
    (0, game_1.applyPlayerMove)(state, 'u3', 2, 3);
    console.log('ERROR: this should have failed');
}
catch (error) {
    if (error instanceof Error)
        console.log(error.message);
}
separator('reject invalid move');
try {
    (0, game_1.applyPlayerMove)(state, 'u1', 0, 0);
    console.log('ERROR: this should have failed');
}
catch (error) {
    if (error instanceof Error)
        console.log(error.message);
}
separator('abandon active game');
const abandonedState = (0, game_1.abandonGame)(state, 'u1');
console.log('status =>', abandonedState.status);
console.log('winner =>', abandonedState.winner);
separator('abandon waiting game');
const waitingState = (0, game_1.createInitialGameState)('u1', null);
const abandonedWaitingState = (0, game_1.abandonGame)(waitingState, 'u1');
console.log('status =>', abandonedWaitingState.status);
console.log('winner =>', abandonedWaitingState.winner);
separator('reject abandon from outsider');
try {
    (0, game_1.abandonGame)(state, 'u3');
    console.log('ERROR: this should have failed');
}
catch (error) {
    if (error instanceof Error)
        console.log(error.message);
}
// Run with: npx ts-node logic/game-test.ts
