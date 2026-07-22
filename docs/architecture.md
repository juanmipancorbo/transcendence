# Architecture

## Project Goal

Build a web-based online Reversi game for ft_transcendence.

The initial MVP — register/log in, two users join a match, play a server-validated
Reversi game to completion, and store the result — is implemented. The project has
since grown well past it: matchmaking, spectators, timed games, an XP/level system,
friends, and direct chat all exist today. The sections below describe the system as
it is now; the "Team Ownership" and "Immediate Development Priorities" notes near
the end are kept as original planning context.

---

## Technology Stack

- **Frontend** — Next.js 16 (App Router) + React 19 + Tailwind CSS. Talks to the
  backend over REST and a single binary WebSocket. Runs on port 3000 inside its
  container.
- **Backend** — Node.js + TypeScript, Express 5 with `express-ws` for WebSockets.
  A single service (`backend/app`) on port 3000. TypeScript path aliases: `@utils`,
  `@endpoints`, `@gameLogic`, `@databaseAccess`.
- **Database** — PostgreSQL 18. Schema initialised from a single `database/schema.sql`.
- **Gateway** — nginx terminates TLS and reverse-proxies: `/api/*` → backend (the
  `/api` prefix is stripped), everything else → frontend. WebSocket upgrades are
  passed through. Exposed on host ports `8080` (HTTP → redirects to HTTPS) and
  `8443` (HTTPS).
- **Orchestration** — Docker Compose (`compose.yaml`), with a `Makefile` wrapper
  (`make up`, `make down`, `make seed-db`, `make clean`, …) and `setup-env.sh` to
  bootstrap env files and self-signed certs.

### Services (compose.yaml)

- `database` — PostgreSQL, initialised from `database/schema.sql`.
- `backend` — Express API + WebSocket server.
- `frontend` — Next.js app.
- `nginx` — TLS-terminating reverse proxy / gateway.

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

Moves travel over the WebSocket connection as binary frames (see
`docs/WEBSOCKETS.md`), not over REST.

1. the player clicks a cell on the board
2. the frontend sends a `ConsumeTurn` message (row + col) over the game socket
3. the backend checks, via the Reversi engine and the in-memory `GameSession`:
   - the socket belongs to a player in an active game
   - it is that user's turn
   - the move is valid
4. the backend applies the move using the Reversi engine
5. the backend persists the move (appended to the game's `moves` array) and updates
   the in-memory game state
6. the backend broadcasts the changed cells (`MoveUpdate`) and the next turn to both
   players and any spectators
7. the frontend re-renders the board

Game state is held in memory in a `GameSession` while a match is live, and mirrored
to PostgreSQL move-by-move so an unfinished game can be rebuilt (by replaying its
moves) if the backend restarts.

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

## Database Model

The full schema lives in `database/schema.sql` (Postgres runs it on first init).
It has grown well past the original "keep it simple" sketch.

### users

- `id` (UUID)
- `username` (unique), `email` (unique)
- `password_hash` (null for OAuth accounts)
- `account_host` — `'local'` or `'google'`
- `avatar_url`, `bio`
- `current_game` (UUID → games.id, nullable)
- `games_played`, `games_won`, `games_lost`
- `xp`, `level` — level is derived from xp by a DB trigger
- `created_at`, `updated_at`

### games

- `id` (UUID)
- `white_player_id`, `black_player_id` (→ users.id)
- `time_left_white`, `time_left_black` — remaining time in seconds (`-1` = untimed)
- `friendly` — ranked (false) vs. friendly (true, no xp/stats)
- `allow_spectators`
- `moves` — array of `move` composite values `(row, col, player)`; the game is
  **reconstructed by replaying these moves**, there is no single `board_state` column
- `winner_id` (nullable)
- `created_at`, `finished_at`

### auth_sessions

Refresh-token sessions (see `AUTH.md`): `id`, `user_id`, `refresh_token_hash`
(SHA256), `expires_at`, timestamps.

### Social tables

- `friends` — unordered unique pairs (stored canonically `user1_id < user2_id`)
- `friend_requests` — directional pending requests (`sender_id` → `receiver_id`)
- `chats` — one row per 1-to-1 conversation (unordered pair); a chat row is created
  automatically when two users become friends
- `messages` — messages belonging to a chat

### XP / level system

`xp_for_level(n)` and `level_from_xp(xp)` (BASE 100, EXPONENT 1.5) plus a trigger
keep `users.level` in sync with `users.xp`. `report_game()` awards xp to the winner
of a ranked game and updates win/loss counts.

### Relations

- one user can participate in many games; one game has exactly two players
- one game may have one winner or end in a draw/abandonment

---

## Repository Structure

```
transcendence/
├── frontend/                # Next.js app (app router, components, hooks, lib)
├── backend/
│   ├── app/                 # TypeScript source (src/), package.json, tsconfig
│   └── container/           # Dockerfile + .env(.example)
├── database/
│   ├── schema.sql           # Full DB schema (run on init)
│   └── container/           # .env(.example)
├── nginx/
│   ├── nginx.conf           # Reverse-proxy / gateway config
│   └── certs/               # Self-signed TLS certs (generated by setup-env.sh)
├── shared-data/             # Types shared between frontend and backend
├── docs/                    # architecture.md, WEBSOCKETS.md
├── compose.yaml             # Docker Compose (database, backend, frontend, nginx)
├── Makefile                 # up / down / seed-db / clean helpers
├── setup-env.sh             # Bootstraps env files
└── AUTH.md
```

### frontend

Next.js App Router. `app/` (routes: login, register, google callback, logged-in
area), `components/`, `hooks/` (`useAuth`, `useWs`, `useGame`, …), `lib/` (API
client, token storage, WebSocket client, config).

### backend (`backend/app/src`)

- `index.ts` — Express app, router mounting, healthcheck, WS endpoint
- `websockets.ts` — WebSocket entrypoint (`/ws/create`)
- `database/<domain>/` — per-domain `router` / `controller` / `service` / `repository`
  for `auth`, `google`, `user`, `friend`, `chat`, `leaderboard`, `game`
- `logic/` — Reversi engine (`game.ts`) and the realtime `sync/` layer
- `middleware/` — `auth-middleware`, `error-middleware`
- `endpoints-data/` — Zod request schemas and response types
- `utils/` — JWT, password hashing, validation middlewares, pg pool, errors

### REST endpoints

Mounted in `index.ts`:

| Prefix         | Purpose |
|----------------|---------|
| `/auth`        | register, login, me, refresh, logout |
| `/google`      | Google OAuth login |
| `/users`       | public profile, update username/bio |
| `/friends`     | friends list + friend requests (all authenticated) |
| `/chats`       | conversation history (sending is over the WebSocket) |
| `/leaderboard` | top players |
| `/games`       | active game session info by id |
| `/health`      | healthcheck |
| `/ws/create`   | the single WebSocket endpoint |

### docs

- `architecture.md` — this document
- `WEBSOCKETS.md` — the binary realtime protocol

Auth specifics live in `AUTH.md` at the repo root.

---

## Git Workflow

### Main branch

- `main` is the main branch — shared and unprotected

### Rule

- **features and significant changes** are developed in their own branch and merged
  into `main` once working
- **quick fixes and small, non-breaking additions** are pushed directly to `main`

### Example branch names (from the actual history)

- `feature/game-logic`
- `feature/backend-leaderboard-functionality`
- `feat/profile-bio-persistence`
- `fix/quickplay-join-game`
- `style/retro-ui-prototype`
- `auth`, `sync`, `ws-global`

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
- move validation and game state are owned by the backend, never the client

(The original plan deferred chat, friends, and statistics until after the core game.
The core game shipped, and those features — chat, friends, and an XP/stats system —
have since been added.)
