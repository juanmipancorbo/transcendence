# Architecture

## Project Goal

Build a web-based online Reversi game for ft_transcendence.

Initial MVP:
- user can register and log in
- two users can join a match
- both users can play the same Reversi game online
- the server validates all moves
- the game ends correctly
- the result is stored

---

## Core Architecture

The server is the source of truth.

This means:
- the frontend does not decide whether a move is valid
- the client only sends the intended move
- the backend validates the move using the game engine
- the backend updates the game state
- the backend stores the updated state
- the backend sends the new state to both players through realtime communication

### Move flow

1. the player clicks a cell on the board
2. the frontend sends the move to the backend
3. the backend checks:
   - game exists
   - user belongs to the game
   - it is the user's turn
   - the move is valid
4. the backend applies the move using the Reversi engine
5. the backend updates and stores the game state
6. the backend emits the new state to both players
7. the frontend re-renders the board

---

## Shared Game State

All parts of the project must use the same game state structure.

### Board representation

- 8x8 board
- `0` = EMPTY
- `1` = BLACK
- `2` = WHITE

### GameState

- board: 8x8 matrix
- currentTurn: BLACK | WHITE
- status: WAITING | ACTIVE | FINISHED | ABANDONED
- blackPlayerId
- whitePlayerId
- winner: BLACK | WHITE | DRAW | null
- createdAt
- updatedAt

### Notes

- `validMoves` can be calculated by the backend and sent to the frontend when needed
- the frontend should only display the state, not own the logic
- the backend is responsible for rule validation

---

## Initial Database Model

The initial database model should stay simple.

### users

- id
- username
- email
- password_hash
- avatar_url
- created_at
- updated_at

### games

- id
- black_player_id
- white_player_id
- board_state
- current_turn
- status
- winner
- created_at
- updated_at

### Relations

- one user can participate in many games
- one game has two players
- one game may have one winner or end in a draw

### Notes

- `board_state` stores the current board
- move history can be added later if needed
- advanced statistics can be derived later from finished games

---

## Repository Structure

- ft_transcendence/
  - frontend/
  - backend/
  - docs/
  - docker-compose.yml
  - .env.example
  - .gitignore
  - README.md

### frontend

Contains:
- pages
- components
- routing
- API calls
- realtime client logic
- game UI

### backend

Contains:
- auth
- routes
- controllers
- services
- game engine
- sockets
- database access

### docs

Contains:
- architecture notes
- game state definition
- API notes
- socket events
- technical decisions

---

## Git Workflow

### Main branch

- `main` is the main branch

### Rule

- nobody works directly on `main`
- each feature must be developed in its own branch

### Example branch names

- `feature/game-logic`
- `feature/backend-games`
- `feature/frontend-board`
- `feature/realtime-sockets`
- `feature/auth-login`

### Commits

Use clear commit messages, for example:
- `add initial game state structure`
- `implement valid move detection`
- `create games table`
- `add login endpoint`
- `render board component`

### Merge policy

- merge often
- avoid long-lived branches
- discuss shared structures before changing them

---

## Team Ownership

### Person 1

Reversi engine:
- game state definition
- initial board
- valid move detection
- apply move
- turn handling
- game over logic

### Person 2

Backend and database:
- backend structure
- users and games models
- game persistence
- game endpoints
- integration with game engine

### Person 3

Frontend:
- frontend structure
- routing
- login/register pages
- lobby
- board rendering
- game UI

### Person 4

Realtime:
- websocket/socket setup
- player connection
- match events
- move events
- state broadcast
- disconnect handling

### Person 5

Auth and infrastructure:
- register/login
- password hashing
- session/JWT/cookie strategy
- protected routes
- Docker base
- environment setup
- backend/database connection

---

## Immediate Development Priorities

### Start now

- define shared game state
- define database base model
- create frontend structure
- create backend structure
- start Reversi game engine

### First milestone

Two registered users can:
- enter the application
- join the same game
- play a full Reversi match online
- receive validated state updates from the server
- store the final result

---

## Important Rules

- the server is always authoritative
- game rules live in the backend game engine
- the frontend displays state and sends user intent
- database design must stay simple at first
- build the core game before extra features
- do not start with tournament, chat, friends, or advanced statistics
