import {
	BLACK,
	WHITE,
	createInitialGameState,
	getValidMoves,
	applyPlayerMove,
	isPlayersTurn,
	getPlayerByUserId,
	printBoard,
} from './game';

function separator(title: string): void
{
	console.log('\n=== ' + title + ' ===');
}

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

// to execute:  npx ts-node logic/game-test.ts