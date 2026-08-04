import {
	BLACK,
	WHITE,
	createInitialGameState,
	getPublicGameState,
	applyPlayerMove,
	countPieces,
	getWinnerUserId,
	printBoard,
} from './game';

function assert(condition: boolean, message: string): void
{
	if (!condition)
		throw new Error(message);
}

function getCurrentUserId(currentTurn: number): string
{
	return (currentTurn === BLACK ? 'u1' : 'u2');
}

const initialState = createInitialGameState('u1', 'u2');
assert(getWinnerUserId({ ...initialState, winner: BLACK }) === 'u1', 'BLACK winner ID should be u1');
assert(getWinnerUserId({ ...initialState, winner: WHITE }) === 'u2', 'WHITE winner ID should be u2');
assert(getWinnerUserId({ ...initialState, winner: 'DRAW' }) === null, 'DRAW should not have a winner ID');

let state = createInitialGameState('u1', 'u2');
let turnCount = 0;

console.log('=== FULL GAME TEST START ===');
printBoard(state.board);
console.log('status =>', state.status);
console.log('currentTurn =>', state.currentTurn);

while (state.status === 'ACTIVE')
{
	const publicState = getPublicGameState(state);
	const validMoves = publicState.validMoves;

	assert(validMoves.length > 0, 'Active game with no valid moves');

	const move = validMoves[0];
	const userId = getCurrentUserId(state.currentTurn);

	console.log('\n--- turn', turnCount + 1, '---');
	console.log('player =>', state.currentTurn === BLACK ? 'BLACK' : 'WHITE');
	console.log('userId =>', userId);
	console.log('move =>', move);

	state = applyPlayerMove(state, userId, move.row, move.col);

	printBoard(state.board);
	console.log('status =>', state.status);
	console.log('currentTurn =>', state.currentTurn);
	console.log('winner =>', state.winner);

	turnCount++;
	assert(turnCount <= 200, 'Too many turns, possible infinite loop');
}

const pieces = countPieces(state.board);

console.log('\n=== FULL GAME TEST END ===');
console.log('final status =>', state.status);
console.log('winner =>', state.winner);
console.log('black =>', pieces.black);
console.log('white =>', pieces.white);
console.log('total turns =>', turnCount);

assert(state.status === 'FINISHED', 'Game did not finish correctly');

if (pieces.black > pieces.white)
	assert(state.winner === BLACK, 'Winner should be BLACK');
else if (pieces.white > pieces.black)
	assert(state.winner === WHITE, 'Winner should be WHITE');
else
	assert(state.winner === 'DRAW', 'Winner should be DRAW');

console.log('\nFull game test passed');