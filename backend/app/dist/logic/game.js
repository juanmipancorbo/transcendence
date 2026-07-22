"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_ABANDONED = exports.STATUS_FINISHED = exports.STATUS_ACTIVE = exports.STATUS_WAITING = exports.WHITE = exports.BLACK = exports.EMPTY = void 0;
exports.isInsideBoard = isInsideBoard;
exports.getOpponent = getOpponent;
exports.cloneBoard = cloneBoard;
exports.createEmptyBoard = createEmptyBoard;
exports.createInitialBoard = createInitialBoard;
exports.createInitialGameState = createInitialGameState;
exports.getPlayerByUserId = getPlayerByUserId;
exports.isPlayersTurn = isPlayersTurn;
exports.applyPlayerMove = applyPlayerMove;
exports.abandonGame = abandonGame;
exports.getFlipsInDirection = getFlipsInDirection;
exports.getFlipsForMove = getFlipsForMove;
exports.isValidMove = isValidMove;
exports.getValidMoves = getValidMoves;
exports.getPublicGameState = getPublicGameState;
exports.hasAnyValidMove = hasAnyValidMove;
exports.isBoardFull = isBoardFull;
exports.countPieces = countPieces;
exports.getWinner = getWinner;
exports.isGameOver = isGameOver;
exports.applyMove = applyMove;
exports.printBoard = printBoard;
exports.EMPTY = 0;
exports.BLACK = 1;
exports.WHITE = 2;
exports.STATUS_WAITING = 'WAITING';
exports.STATUS_ACTIVE = 'ACTIVE';
exports.STATUS_FINISHED = 'FINISHED';
exports.STATUS_ABANDONED = 'ABANDONED';
const DIRECTIONS = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
];
function isInsideBoard(row, col) {
    return (row >= 0 && row < 8 && col >= 0 && col < 8);
}
function getOpponent(player) {
    return (player === exports.BLACK ? exports.WHITE : exports.BLACK);
}
function cloneBoard(board) {
    return board.map((row) => [...row]);
}
function createEmptyBoard() {
    const board = [];
    for (let row = 0; row < 8; row++) {
        const line = [];
        for (let col = 0; col < 8; col++)
            line.push(exports.EMPTY);
        board.push(line);
    }
    return (board);
}
function createInitialBoard() {
    const board = createEmptyBoard();
    board[3][3] = exports.WHITE;
    board[3][4] = exports.BLACK;
    board[4][3] = exports.BLACK;
    board[4][4] = exports.WHITE;
    return (board);
}
function createInitialGameState(blackPlayerId = null, whitePlayerId = null) {
    const now = new Date().toISOString();
    const status = blackPlayerId !== null && whitePlayerId !== null
        ? exports.STATUS_ACTIVE
        : exports.STATUS_WAITING;
    return ({
        board: createInitialBoard(),
        currentTurn: exports.BLACK,
        status,
        blackPlayerId,
        whitePlayerId,
        winner: null,
        createdAt: now,
        updatedAt: now,
    });
}
function getPlayerByUserId(state, userId) {
    if (state.blackPlayerId === userId)
        return (exports.BLACK);
    if (state.whitePlayerId === userId)
        return (exports.WHITE);
    return (null);
}
function isPlayersTurn(state, userId) {
    const player = getPlayerByUserId(state, userId);
    if (player === null)
        return (false);
    return (state.currentTurn === player);
}
function applyPlayerMove(state, userId, row, col) {
    const player = getPlayerByUserId(state, userId);
    if (player === null)
        throw new Error('User is not part of this game');
    if (state.status !== exports.STATUS_ACTIVE)
        throw new Error('Game is not active');
    if (state.currentTurn !== player)
        throw new Error('It is not this player turn');
    return (applyMove(state, row, col));
}
function abandonGame(state, userId) {
    const player = getPlayerByUserId(state, userId);
    if (player === null)
        throw new Error('User is not part of this game');
    if (state.status === exports.STATUS_FINISHED)
        throw new Error('Game is already finished');
    if (state.status === exports.STATUS_ABANDONED)
        return (state);
    const bothPlayersAssigned = state.blackPlayerId !== null && state.whitePlayerId !== null;
    const winner = bothPlayersAssigned ? getOpponent(player) : null;
    return (Object.assign(Object.assign({}, state), { status: exports.STATUS_ABANDONED, winner, updatedAt: new Date().toISOString() }));
}
function getFlipsInDirection(board, row, col, player, dRow, dCol) {
    const flips = [];
    const opponent = getOpponent(player);
    let currentRow = row + dRow;
    let currentCol = col + dCol;
    if (!isInsideBoard(currentRow, currentCol))
        return ([]);
    if (board[currentRow][currentCol] !== opponent)
        return ([]);
    while (isInsideBoard(currentRow, currentCol)) {
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
function getFlipsForMove(board, row, col, player) {
    let flips = [];
    if (!isInsideBoard(row, col))
        return ([]);
    if (board[row][col] !== exports.EMPTY)
        return ([]);
    for (const direction of DIRECTIONS) {
        flips = flips.concat(getFlipsInDirection(board, row, col, player, direction.row, direction.col));
    }
    return (flips);
}
function isValidMove(board, row, col, player) {
    return (getFlipsForMove(board, row, col, player).length > 0);
}
function getValidMoves(board, player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(board, row, col, player))
                moves.push({ row, col });
        }
    }
    return (moves);
}
function getPublicGameState(state) {
    return (Object.assign(Object.assign({}, state), { validMoves: getValidMoves(state.board, state.currentTurn) }));
}
function hasAnyValidMove(board, player) {
    return (getValidMoves(board, player).length > 0);
}
function isBoardFull(board) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === exports.EMPTY)
                return (false);
        }
    }
    return (true);
}
function countPieces(board) {
    let black = 0;
    let white = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === exports.BLACK)
                black++;
            else if (board[row][col] === exports.WHITE)
                white++;
        }
    }
    return ({ black, white });
}
function getWinner(board) {
    const counts = countPieces(board);
    if (counts.black > counts.white)
        return (exports.BLACK);
    if (counts.white > counts.black)
        return (exports.WHITE);
    return ('DRAW');
}
function isGameOver(board) {
    if (isBoardFull(board))
        return (true);
    if (!hasAnyValidMove(board, exports.BLACK) && !hasAnyValidMove(board, exports.WHITE))
        return (true);
    return (false);
}
function applyMove(state, row, col) {
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
    if (isGameOver(board)) {
        return (Object.assign(Object.assign({}, state), { board, status: exports.STATUS_FINISHED, winner: getWinner(board), updatedAt: now }));
    }
    if (opponentHasMove) {
        return (Object.assign(Object.assign({}, state), { board, currentTurn: opponent, updatedAt: now }));
    }
    if (playerHasMove) {
        return (Object.assign(Object.assign({}, state), { board, currentTurn: player, updatedAt: now }));
    }
    return (Object.assign(Object.assign({}, state), { board, status: exports.STATUS_FINISHED, winner: getWinner(board), updatedAt: now }));
}
function printBoard(board) {
    for (let row = 0; row < 8; row++) {
        const line = board[row]
            .map((cell) => {
            if (cell === exports.EMPTY)
                return ('.');
            if (cell === exports.BLACK)
                return ('B');
            return ('W');
        })
            .join(' ');
        console.log(line);
    }
}
