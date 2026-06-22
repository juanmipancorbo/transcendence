import {
	BLACK,
	WHITE,
	createInitialGameState,
	getPublicGameState,
	applyPlayerMove,
	countPieces,
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

function getRandomInt(max: number): number
{
	return (Math.floor(Math.random() * max));
}

function winnerMatchesCount(
	black: number,
	white: number,
	winner: number | 'DRAW' | null,
): boolean
{
	if (black > white)
		return (winner === BLACK);
	if (white > black)
		return (winner === WHITE);
	return (winner === 'DRAW');
}

function runSingleGame(gameIndex: number): void
{
	let state = createInitialGameState('u1', 'u2');
	let turnCount = 0;

	while (state.status === 'ACTIVE')
	{
		const publicState = getPublicGameState(state);
		const validMoves = publicState.validMoves;

		assert(validMoves.length > 0, `Game ${gameIndex}: active game with no valid moves`);

		const randomMove = validMoves[getRandomInt(validMoves.length)];
		const userId = getCurrentUserId(state.currentTurn);

		state = applyPlayerMove(
			state,
			userId,
			randomMove.row,
			randomMove.col,
		);

		turnCount++;
		assert(turnCount <= 200, `Game ${gameIndex}: too many turns`);
	}

	const pieces = countPieces(state.board);
	const totalPieces = pieces.black + pieces.white;

	assert(state.status === 'FINISHED', `Game ${gameIndex}: game did not finish`);
	assert(totalPieces <= 64, `Game ${gameIndex}: too many pieces on board`);
	assert(
		winnerMatchesCount(pieces.black, pieces.white, state.winner),
		`Game ${gameIndex}: winner does not match piece count`,
	);
}

const TOTAL_GAMES = 1000;

console.log(`Starting stress test with ${TOTAL_GAMES} games...`);

for (let i = 0; i < TOTAL_GAMES; i++)
{
	runSingleGame(i + 1);

	if ((i + 1) % 10 === 0)
		console.log(`Completed ${i + 1}/${TOTAL_GAMES} games`);
}

console.log('Stress test passed');