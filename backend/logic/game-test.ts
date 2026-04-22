import {
	BLACK,
	WHITE,
	createInitialGameState,
	getValidMoves,
	applyPlayerMove,
	isPlayersTurn,
	getPlayerByUserId,
	getPublicGameState,
	abandonGame,
	printBoard,
} from './game';

function separator(title: string): void
{
	console.log('\n=== ' + title + ' ===');
}

separator('initial state status');
console.log('without players =>', createInitialGameState().status);
console.log('with players =>', createInitialGameState('u1', 'u2').status);

const state = createInitialGameState('u1', 'u2');

separator('initial board');
printBoard(state.board);

separator('player mapping');
console.log('u1 =>', getPlayerByUserId(state, 'u1'));
console.log('u2 =>', getPlayerByUserId(state, 'u2'));
console.log('u3 =>', getPlayerByUserId(state, 'u3'));

separator('turn check');
console.log('is u1 turn?', isPlayersTurn(state, 'u1'));
console.log('is u2 turn?', isPlayersTurn(state, 'u2'));

separator('valid moves');
console.log('BLACK valid moves:', getValidMoves(state.board, BLACK));
console.log('WHITE valid moves:', getValidMoves(state.board, WHITE));

separator('public game state');
const publicState = getPublicGameState(state);
console.log('currentTurn =>', publicState.currentTurn);
console.log('validMoves =>', publicState.validMoves);

separator('apply valid move from u1');
const nextState = applyPlayerMove(state, 'u1', 2, 3);
printBoard(nextState.board);
console.log('currentTurn =>', nextState.currentTurn);

separator('reject wrong turn');
try
{
	applyPlayerMove(state, 'u2', 2, 3);
	console.log('ERROR: this should have failed');
}
catch (error)
{
	if (error instanceof Error)
		console.log(error.message);
}

separator('reject user not in game');
try
{
	applyPlayerMove(state, 'u3', 2, 3);
	console.log('ERROR: this should have failed');
}
catch (error)
{
	if (error instanceof Error)
		console.log(error.message);
}

separator('reject invalid move');
try
{
	applyPlayerMove(state, 'u1', 0, 0);
	console.log('ERROR: this should have failed');
}
catch (error)
{
	if (error instanceof Error)
		console.log(error.message);
}

separator('abandon active game');
const abandonedState = abandonGame(state, 'u1');
console.log('status =>', abandonedState.status);
console.log('winner =>', abandonedState.winner);

separator('abandon waiting game');
const waitingState = createInitialGameState('u1', null);
const abandonedWaitingState = abandonGame(waitingState, 'u1');
console.log('status =>', abandonedWaitingState.status);
console.log('winner =>', abandonedWaitingState.winner);

separator('reject abandon from outsider');
try
{
	abandonGame(state, 'u3');
	console.log('ERROR: this should have failed');
}
catch (error)
{
	if (error instanceof Error)
		console.log(error.message);
}

// Run with: npx ts-node logic/game-test.ts