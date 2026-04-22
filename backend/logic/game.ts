export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const STATUS_WAITING = 'WAITING';
export const STATUS_ACTIVE = 'ACTIVE';
export const STATUS_FINISHED = 'FINISHED';
export const STATUS_ABANDONED = 'ABANDONED';

export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Winner = 1 | 2 | 'DRAW' | null;
export type GameStatus =
	| 'WAITING'
	| 'ACTIVE'
	| 'FINISHED'
	| 'ABANDONED';

export type Position = {
	row: number;
	col: number;
};

export type Board = Cell[][];

export type GameState = {
	board: Board;
	currentTurn: Player;
	status: GameStatus;
	blackPlayerId: string | null;
	whitePlayerId: string | null;
	winner: Winner;
	createdAt: string;
	updatedAt: string;
};

export type PublicGameState = GameState & {
	validMoves: Position[];
};

const DIRECTIONS: Position[] = [
	{ row: -1, col: -1 },
	{ row: -1, col: 0 },
	{ row: -1, col: 1 },
	{ row: 0, col: -1 },
	{ row: 0, col: 1 },
	{ row: 1, col: -1 },
	{ row: 1, col: 0 },
	{ row: 1, col: 1 },
];

export function isInsideBoard(row: number, col: number): boolean
{
	return (row >= 0 && row < 8 && col >= 0 && col < 8);
}

export function getOpponent(player: Player): Player
{
	return (player === BLACK ? WHITE : BLACK);
}

export function cloneBoard(board: Board): Board
{
	return (board.map((row) => [...row]) as Board);
}

export function createEmptyBoard(): Board
{
	const board: Board = [];

	for (let row = 0; row < 8; row++)
	{
		const line: Cell[] = [];

		for (let col = 0; col < 8; col++)
			line.push(EMPTY);
		board.push(line);
	}
	return (board);
}

export function createInitialBoard(): Board
{
	const board = createEmptyBoard();

	board[3][3] = WHITE;
	board[3][4] = BLACK;
	board[4][3] = BLACK;
	board[4][4] = WHITE;
	return (board);
}

export function createInitialGameState(
	blackPlayerId: string | null = null,
	whitePlayerId: string | null = null,
): GameState
{
	const now = new Date().toISOString();
	const status =
		blackPlayerId !== null && whitePlayerId !== null
			? STATUS_ACTIVE
			: STATUS_WAITING;

	return ({
		board: createInitialBoard(),
		currentTurn: BLACK,
		status,
		blackPlayerId,
		whitePlayerId,
		winner: null,
		createdAt: now,
		updatedAt: now,
	});
}

export function getPlayerByUserId(
	state: GameState,
	userId: string,
): Player | null
{
	if (state.blackPlayerId === userId)
		return (BLACK);
	if (state.whitePlayerId === userId)
		return (WHITE);
	return (null);
}

export function isPlayersTurn(
	state: GameState,
	userId: string,
): boolean
{
	const player = getPlayerByUserId(state, userId);

	if (player === null)
		return (false);
	return (state.currentTurn === player);
}

export function applyPlayerMove(
	state: GameState,
	userId: string,
	row: number,
	col: number,
): GameState
{
	const player = getPlayerByUserId(state, userId);

	if (player === null)
		throw new Error('User is not part of this game');
	if (state.status !== STATUS_ACTIVE)
		throw new Error('Game is not active');
	if (state.currentTurn !== player)
		throw new Error('It is not this player turn');
	return (applyMove(state, row, col));
}

export function getFlipsInDirection(
	board: Board,
	row: number,
	col: number,
	player: Player,
	dRow: number,
	dCol: number,
): Position[]
{
	const flips: Position[] = [];
	const opponent = getOpponent(player);
	let currentRow = row + dRow;
	let currentCol = col + dCol;

	if (!isInsideBoard(currentRow, currentCol))
		return ([]);
	if (board[currentRow][currentCol] !== opponent)
		return ([]);
	while (isInsideBoard(currentRow, currentCol))
	{
		const cell = board[currentRow][currentCol];

		if (cell === opponent)
			flips.push({ row: currentRow, col: currentCol });
		else if (cell === player)
			return (flips);
		else
			return ([]);
		currentRow += dRow;
		currentCol += dCol;
	}
	return ([]);
}

export function getFlipsForMove(
	board: Board,
	row: number,
	col: number,
	player: Player,
): Position[]
{
	let flips: Position[] = [];

	if (!isInsideBoard(row, col))
		return ([]);
	if (board[row][col] !== EMPTY)
		return ([]);
	for (const direction of DIRECTIONS)
	{
		flips = flips.concat(
			getFlipsInDirection(
				board,
				row,
				col,
				player,
				direction.row,
				direction.col,
			),
		);
	}
	return (flips);
}

export function isValidMove(
	board: Board,
	row: number,
	col: number,
	player: Player,
): boolean
{
	return (getFlipsForMove(board, row, col, player).length > 0);
}

export function getValidMoves(board: Board, player: Player): Position[]
{
	const moves: Position[] = [];

	for (let row = 0; row < 8; row++)
	{
		for (let col = 0; col < 8; col++)
		{
			if (isValidMove(board, row, col, player))
				moves.push({ row, col });
		}
	}
	return (moves);
}

export function getPublicGameState(state: GameState): PublicGameState
{
	return ({
		...state,
		validMoves: getValidMoves(state.board, state.currentTurn),
	});
}

export function hasAnyValidMove(board: Board, player: Player): boolean
{
	return (getValidMoves(board, player).length > 0);
}

export function isBoardFull(board: Board): boolean
{
	for (let row = 0; row < 8; row++)
	{
		for (let col = 0; col < 8; col++)
		{
			if (board[row][col] === EMPTY)
				return (false);
		}
	}
	return (true);
}

export function countPieces(board: Board): { black: number; white: number }
{
	let black = 0;
	let white = 0;

	for (let row = 0; row < 8; row++)
	{
		for (let col = 0; col < 8; col++)
		{
			if (board[row][col] === BLACK)
				black++;
			else if (board[row][col] === WHITE)
				white++;
		}
	}
	return ({ black, white });
}

export function getWinner(board: Board): Winner
{
	const counts = countPieces(board);

	if (counts.black > counts.white)
		return (BLACK);
	if (counts.white > counts.black)
		return (WHITE);
	return ('DRAW');
}

export function isGameOver(board: Board): boolean
{
	if (isBoardFull(board))
		return (true);
	if (!hasAnyValidMove(board, BLACK) && !hasAnyValidMove(board, WHITE))
		return (true);
	return (false);
}

export function applyMove(
	state: GameState,
	row: number,
	col: number,
): GameState
{
	const player = state.currentTurn;
	const flips = getFlipsForMove(state.board, row, col, player);

	if (flips.length === 0)
		throw new Error('Invalid move');

	const board = cloneBoard(state.board);

	board[row][col] = player;
	for (const flip of flips)
		board[flip.row][flip.col] = player;

	const opponent = getOpponent(player);
	const opponentHasMove = hasAnyValidMove(board, opponent);
	const playerHasMove = hasAnyValidMove(board, player);
	const now = new Date().toISOString();

	if (isGameOver(board))
	{
		return ({
			...state,
			board,
			status: STATUS_FINISHED,
			winner: getWinner(board),
			updatedAt: now,
		});
	}
	if (opponentHasMove)
	{
		return ({
			...state,
			board,
			currentTurn: opponent,
			updatedAt: now,
		});
	}
	if (playerHasMove)
	{
		return ({
			...state,
			board,
			currentTurn: player,
			updatedAt: now,
		});
	}
	return ({
		...state,
		board,
		status: STATUS_FINISHED,
		winner: getWinner(board),
		updatedAt: now,
	});
}

export function printBoard(board: Board): void
{
	for (let row = 0; row < 8; row++)
	{
		const line = board[row]
			.map((cell) =>
			{
				if (cell === EMPTY)
					return ('.');
				if (cell === BLACK)
					return ('B');
				return ('W');
			})
			.join(' ');

		console.log(line);
	}
}