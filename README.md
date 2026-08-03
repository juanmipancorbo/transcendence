*This project has been created as part of the 42 curriculum by intherna, jpancorb, anguil-l, cmarrued, pmorello.*

# ft_transcendence — Reversi

> A real-time, server-authoritative online **Reversi (Othello)** platform, built for
> *ft_transcendence* of the 42 curriculum.
> Frontend design: a custom **retro pixel-art** design system.

---

## Table of Contents

- [Description](#description)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Technical Stack](#technical-stack)
- [Database Schema](#database-schema)
- [Features List](#features-list)
- [Modules](#modules)
- [Mandatory Requirements Compliance](#mandatory-requirements-compliance)
- [Instructions](#instructions)
- [Individual Contributions](#individual-contributions)
- [Resources](#resources)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Description

**ft_transcendence — Reversi** is a full-stack web application where two players sign in,
get matched, and play a complete game of **Reversi** against each other in real time, with a
third-party audience able to spectate. The whole system is built around one rule: **the
server is the single source of truth**. The browser never decides whether a move is legal —
it only sends the *intent* to play a cell; the backend validates it with its own Reversi
engine, updates the game, persists it, and broadcasts the new state to both players and any
spectators.

### Key Features

- **♟️ Real-time Reversi** — 8×8 board, server-validated moves, live turn/valid-move hints,
  optional per-player time limits, and pass detection.
- **🔐 Authentication** — email/password (Argon2 + JWT access/refresh tokens) **and** Google
  OAuth 2.0 sign-in.
- **🎯 Matchmaking** — a casual queue that pairs the next two waiting players and spins up a
  game session automatically.
- **👀 Spectators** — games can be opened to spectators, who receive the same live state
  stream as the players.
- **♻️ Crash recovery** — every move is persisted move-by-move; an in-progress game survives
  a backend restart by replaying its stored moves.
- **🧑‍🤝‍🧑 Social layer** — friends, friend requests, and 1-to-1 **direct chat**, plus in-game
  chat between players and spectators.
- **📈 Progression** — persistent XP/level, win/loss statistics, a global
  **leaderboard**, six achievements with progress, and paginated match history with
  move-by-move review.
- **👤 Profiles** — editable username/bio, normalized avatar uploads, a default avatar,
  and public profile pages.
- **⚔️ Custom duels** — challenge a friend with selectable turn time and spectator access.

The realtime layer runs over a **single binary WebSocket** with a custom, per-stage protocol
(auth → lobby → game). It is documented in [`docs/WEBSOCKETS.md`](docs/WEBSOCKETS.md).

---

## Team Information

Technical ownership existed throughout development, while the formal PO, PM and Technical
Lead labels were consolidated during the final project phase. Every active member also
remained a Developer. The table documents current responsibility and evaluation coverage.

| Login | Name | Role | Main Responsibilities |
|-------|------|------|-----------------------|
| **intherna** | Inti Hernández Servitja | Technical Lead / Developer | Realtime WebSocket subsystem (binary protocol, socket lifecycle, sessions, crash recovery), backend backbone & DB integration, frontend WS client and game hooks. |
| **jpancorb** | Juan Miguel Pancorbo Gutiérrez | Product Owner / Developer | Core Reversi engine, end-to-end gameplay validation, frontend evolution, retro design system, statistics and gamification. |
| **cmarrued** | Carlos Marruedo | Project Manager / Developer | Built the frontend foundation: app structure, routing, the initial pages and components (login/register, game view, profile, lobby, leaderboard), and the original Stitch-assisted *Velocity Noir* design; plus supporting backend user/friend endpoints. |
| **anguil-l** | Antonio Guil Luque | Developer | Authentication & security foundation: JWT access/refresh strategy, Argon2 password hashing, auth middleware, login/register integration. |
| **pmorello** | Pau Anand Morello | Developer | Avatar pipeline and current maintenance/evaluation ownership of the inherited infrastructure and database foundation. |
| **mvelazqu** | Maximiliano Velázquez *(former member)* | — | Docker Compose / nginx infrastructure, Makefile, backend database services (user/game/auth repositories & services), initial game-management endpoints, seed/reset database scripts, centralized error handling (`ApiError`). |

### Current Ownership And Evaluation Coverage

Historical authorship and current ownership are documented separately. Ownership means that the
current member is responsible for reviewing, maintaining, testing and explaining that area;
it does not replace the original Git attribution.

| Member | Primary evaluation area |
|---|---|
| **intherna** | Architecture, binary WebSocket protocol, sessions, crash recovery and backend integration. |
| **jpancorb** | Product decisions, core Reversi engine, retro design system, statistics, gamification and end-to-end gameplay validation. |
| **cmarrued** | Project coordination, frontend foundation, client authentication lifecycle and spectator UI. |
| **anguil-l** | Authentication, JWT access/refresh model, Argon2, middleware and validation. |
| **pmorello** | Avatar pipeline plus current maintenance and evaluation ownership of the infrastructure and database foundation inherited after mvelazqu left the team. |

All active members remain responsible for understanding the complete product and their own
contributions. The handover to pmorello does not claim authorship of code originally written
by mvelazqu. Before evaluation, pmorello will complete the handover by reviewing the
Docker/nginx/Makefile flow, validating a clean deployment and studying the database
architecture.

See [Individual Contributions](#individual-contributions) for a detailed breakdown.

---

## Project Management

- **Task tracking:** Trello was trialed primarily by cmarrued, with some early use by
  intherna, but the team stopped relying on it because adoption was inconsistent. Day-to-day
  ownership was tracked through Git branches, commits and Slack coordination.
- **Communication:** **Slack** — day-to-day coordination, code-review pings, and design
  discussions.
- **Version control workflow:** Git on a shared, unprotected `main` with a pragmatic
  branching policy: **features and significant changes** get their own branch and are merged
  into `main` once working (e.g. `feature/game-logic`, `feature/backend-leaderboard-functionality`,
  `feat/profile-bio-persistence`, `fix/quickplay-join-game`, `style/retro-ui-prototype`,
  `auth`, `sync`, `ws-global`), while **quick fixes and small, non-breaking additions** are
  pushed directly to `main`. The team favored **merging often** and avoiding long-lived
  branches; shared data structures (game state, DB schema, the WS protocol) were discussed
  before being changed.
- **Work distribution:** technical areas emerged early around the game engine,
  backend/database, frontend, realtime and authentication/infrastructure. The formal
  PO/PM/Technical Lead labels were not consistently used during that period. In the
  integration phase, members worked across boundaries to complete and stabilize end-to-end
  workflows.

---

## Technical Stack

### Frontend
- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS 3** (an in-house **retro pixel-art** design system)
- A custom **binary WebSocket client** (`frontend/lib/ws/`) and React hooks
  (`useAuth`, `useWs`, `useGame`, `useMsg`, `useGlobalRank`).

### Backend
- **Node.js + TypeScript**
- **Express 5** with **`express-ws`** for the WebSocket endpoint
- **Zod** for request validation
- **jsonwebtoken** (JWT) + **Argon2** (password hashing)
- A single service organized per domain (`auth`, `google`, `user`, `friend`, `chat`,
  `leaderboard`, `game`), each with `router` / `controller` / `service` / `repository`
  layers, plus the standalone Reversi engine and realtime `sync/` layer.

### Database
- **PostgreSQL 18**, initialized from a single `database/schema.sql`.
- **Why PostgreSQL?** The game model leans on features a relational engine gives for free:
  a custom composite `move` type and array columns (`moves move[]`) to store a game as an
  *append-only list of moves*, UUID primary keys, `CHECK`/`UNIQUE` constraints to keep
  friendships and chats canonical, and **stored functions + triggers** to push
  domain logic (XP→level derivation, game reporting, canonical-pair ordering, chat
  auto-creation) into the database itself. Postgres supports all of this natively.

### Gateway & Orchestration
- **nginx** (alpine) terminates TLS and reverse-proxies `/api/*` → backend (stripping the
  `/api` prefix), everything else → frontend, and passes through WebSocket upgrades.
  Exposed on host ports **8080** (HTTP → redirects to HTTPS) and **8443** (HTTPS).
- **Docker Compose** orchestrates four services (`database`, `backend`, `frontend`, `nginx`),
  wrapped by a **Makefile** and a `setup-env.sh` bootstrap script (env files + self-signed
  certs).

### Justification for major technical choices
- **Server-authoritative design** — game rules live *only* in the backend engine; the client
  displays state and sends intent. This makes cheating (forging a board / an illegal move)
  structurally impossible from the browser.
- **Single binary WebSocket + custom protocol** — one connection carries auth, lobby,
  matchmaking, chat, and gameplay. Binary framing keeps per-move messages tiny, and a
  per-stage type-ID namespace keeps the protocol compact. (Auth is sent in-band as the first
  message because the browser `WebSocket` API cannot set custom headers.)
- **Moves as the source of persistence** — a game is stored as its ordered list of moves, not
  a snapshot, so any game state can be rebuilt by replay. This is what enables **crash
  recovery** of in-progress games.

---

## Database Schema

The full schema lives in [`database/schema.sql`](database/schema.sql) and Postgres runs it on
first initialization. It defines a custom `move` composite type, the XP/level functions and
triggers, and helper functions (`report_game`, `add_game_movement`, `get_or_create_chat`,
`send_message`, `are_friends`, …).

```mermaid
erDiagram
    users ||--o{ games : "plays (white/black)"
    users ||--o{ auth_sessions : "has"
    users ||--o{ friend_requests : "sends/receives"
    friends }o--|| users : "user1 / user2"
    users ||--o{ chats : "member of"
    chats ||--o{ messages : "contains"
    users ||--o{ messages : "sends"
    games ||--o| users : "current_game"

    users {
        UUID id PK
        VARCHAR username UK
        VARCHAR email UK
        TEXT password_hash "null for OAuth"
        TEXT account_host "'local' | 'google'"
        TEXT avatar_url
        VARCHAR bio
        UUID current_game FK "-> games.id"
        INT games_played
        INT games_won
        INT games_lost
        INT xp
        INT level "derived from xp by trigger"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    games {
        UUID id PK
        UUID white_player_id FK
        UUID black_player_id FK
        INT time_left_white "-1 = untimed"
        INT time_left_black "-1 = untimed"
        BOOL friendly "ranked vs friendly"
        BOOL allow_spectators
        move_array moves "append-only (row,col,player)"
        UUID winner_id "nullable"
        TIMESTAMP created_at
        TIMESTAMP finished_at
    }
    auth_sessions {
        UUID id PK
        UUID user_id FK
        TEXT refresh_token_hash "SHA256"
        TIMESTAMP expires_at
    }
    friends {
        UUID user1_id PK "canonical: user1 < user2"
        UUID user2_id PK
        TIMESTAMP created_at
    }
    friend_requests {
        UUID sender_id PK
        UUID receiver_id PK
        TIMESTAMP created_at
    }
    chats {
        UUID id PK
        UUID person1_id "canonical: person1 < person2"
        UUID person2_id
        TIMESTAMP created_at
    }
    messages {
        UUID id PK
        UUID chat_id FK
        UUID sender_id FK
        TEXT content
        TIMESTAMP created_at
    }
```

**Tables and relationships**

- **`users`** — accounts (local or Google), profile fields, stats, and the `xp`/`level`
  progression. `level` is kept in sync with `xp` by a `BEFORE INSERT/UPDATE` trigger using
  `level_from_xp(xp)` (BASE 100, EXPONENT 1.5). `current_game` points to the game a user is
  currently in.
- **`games`** — one row per match, referencing two players. **There is no `board_state`
  column**: the `moves move[]` array (each element a `(row, col, player)` composite) *is* the
  game — the board is reconstructed by replaying it. `friendly` toggles ranked vs. XP-free
  games; `allow_spectators` gates the audience.
- **`auth_sessions`** — refresh-token sessions; the token is stored **SHA256-hashed**.
- **`friends`** — unordered unique pairs, stored canonically (`user1_id < user2_id`) via a
  trigger so a friendship is a single row regardless of direction.
- **`friend_requests`** — directional pending requests (`sender_id` → `receiver_id`).
- **`chats`** — one row per 1-to-1 conversation (also canonically ordered); a chat row is
  auto-created by trigger the moment two users become friends.
- **`messages`** — messages belonging to a chat, indexed for newest-first pagination.

Key data types: `UUID` primary keys everywhere, a custom `move` composite type
(`(row smallint, col smallint, player smallint)`), `TIMESTAMP` audit columns, and integer
counters for stats/XP.

---

## Features List

Attribution reflects primary ownership from the git history; most features were collaborative.

| Feature | Description | Primary contributor(s) |
|---------|-------------|------------------------|
| **Reversi game engine** | Board state, valid-move detection, move application, turn handling, pass/no-moves, game-over & winner logic (`backend/app/src/logic/game.ts`). | jpancorb |
| **Realtime WebSocket protocol** | Single binary socket with auth → lobby → game stages, keep-alive, sessions, spectators, reconnect grace, crash recovery. | intherna |
| **Frontend game UI** | Interactive board rendering, valid-move hints, timers, turn indicator, in-game chat, result screen. | jpancorb, cmarrued |
| **Matchmaking / lobby** | Casual queue that pairs waiting players and emits `MatchFound`. | intherna, jpancorb |
| **Spectator mode** | Join a game as a viewer, receive live state, spectator join/leave events. | intherna, jpancorb, cmarrued |
| **Email/password auth** | Registration, login, refresh, logout; Argon2 hashing; JWT access/refresh. | anguil-l |
| **Google OAuth 2.0 login** | Sign in / auto-register with a Google account. | intherna |
| **Friends & requests** | Send/accept/reject friend requests, friends list. | intherna, jpancorb, cmarrued |
| **Direct & in-game chat** | 1-to-1 messaging over the socket; conversation history endpoint; in-game chat. | intherna, jpancorb, cmarrued |
| **XP / level & stats** | DB-driven XP awards, derived levels, win/loss counts. | intherna, jpancorb |
| **Leaderboard** | Global top-players ranking. | jpancorb |
| **Match history & review** | Paginated private/public game history and authenticated move-by-move board reconstruction. | intherna, jpancorb |
| **Achievements** | Six profile achievements with persisted-stat progress and visual feedback. | jpancorb |
| **Configurable duels** | Friend challenges with selectable turn duration and spectator access. | intherna, jpancorb |
| **User profiles** | Editable username/bio, avatar/photo, public profile pages. | cmarrued, pmorello, jpancorb, intherna |
| **Retro design system** | Tailwind-based retro pixel-art UI, shared layout (navbar, sidebar, chat window). | jpancorb |
| **Terms & Privacy page** | In-app terms of service and privacy policy. | jpancorb |

---

## Modules

The *ft_transcendence — Surprise* subject requires **14 points** (Major = 2 pts, Minor = 1 pt).
This project implements **21 points**. Nineteen cover the 14 required points and the full
**5-point bonus cap**; SSR and the custom binary protocol are also claimed as additional
implemented modules.

### Major modules (2 pts each) — 6 × 2 = 12 pts

| # | Category | Module | How it was implemented | Contributor(s) |
|---|----------|--------|------------------------|----------------|
| 1 | Web | **Framework for frontend *and* backend** | **Next.js 16** (React) frontend + **Express 5** backend, each using their framework's routing/architecture conventions. | cmarrued, intherna, mvelazqu, jpancorb, anguil-l |
| 2 | Web | **Real-time features (WebSockets)** | A single binary WebSocket: live state broadcast to players & spectators, graceful connect/disconnect (reconnect grace period), efficient per-move framing. | intherna, jpancorb |
| 3 | Web | **User interaction** | 1-to-1 chat (send/receive between users), public profile pages, and a friends system (add/remove, friends list). | intherna, jpancorb, cmarrued |
| 4 | Gaming | **Complete web-based game** | A server-authoritative **Reversi** engine with clear rules and win/loss/draw conditions (2D). | jpancorb, intherna, cmarrued |
| 5 | Gaming | **Remote players** | Two players on separate machines play in real time; latency-tolerant, with disconnect + **reconnection** handling (60s grace). | intherna, cmarrued, jpancorb |
| 6 | User Management | **Standard user management & authentication** | Profile editing, avatars (with a default), friends + **online status**, profile pages; email/password with **Argon2 + JWT**. | anguil-l, mvelazqu, intherna, cmarrued, pmorello, jpancorb |

### Minor modules (1 pt each) — 9 × 1 = 9 pts

| # | Category | Module | How it was implemented | Contributor(s) |
|---|----------|--------|------------------------|----------------|
| 7 | User Management | **Remote authentication (OAuth 2.0)** | Google Sign-in: authorization-code exchange with auto-provisioning of `account_host='google'` users. | intherna |
| 8 | User Management | **Game statistics & match history** | Wins, losses, XP, level and rank; paginated 1v1 history with dates, opponents and results; six achievements with progress; leaderboard integration; and move-by-move review. | jpancorb, intherna |
| 9 | Gaming | **Game customization options** | Friend duels expose selectable per-player turn times and spectator access, starting from valid default options. | intherna, jpancorb |
| 10 | Gaming | **Spectator mode** | Join a live game as a viewer with real-time state updates and shared in-game chat. | intherna, jpancorb, cmarrued |
| 11 | Gaming | **Gamification system** | Three persistent features: achievements, leaderboard and XP/level. Profiles show six achievement states and progress bars; their source statistics persist in PostgreSQL. | jpancorb, intherna |
| 12 | Web | **Custom-made design system** | Twelve documented reusable React components, a defined retro color palette, typography and pixel iconography. See [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). | jpancorb, cmarrued, intherna |
| 13 | Web | **Server-Side Rendering (SSR)** | Next.js App Router Server Components render the root layout and public legal content, producing initial HTML and SEO metadata before client hydration; the standalone build is served by Node. | intherna, cmarrued |
| 14 | Choice | **Custom module: binary WebSocket protocol** | A hand-designed binary wire format: big-endian `ByteReader`/`ByteWriter` codecs, per-stage type-ID namespaces (auth → lobby → game), length-prefixed UTF-8 strings, compact board/move encodings, in-band token handshake. Fully documented in [`docs/WEBSOCKETS.md`](docs/WEBSOCKETS.md). | intherna |
| 15 | Accessibility & i18n | **Support for additional browsers** | Full workflows tested on Chrome 150, Firefox 152 and Edge 150 with consistent responsive UI and no functional browser-specific limitations. See [`docs/BROWSER_COMPATIBILITY.md`](docs/BROWSER_COMPATIBILITY.md). | jpancorb, intherna |

### Point calculation

| Tier | Count | Points |
|------|-------|--------|
| Major | 6 | 12 |
| Minor | 9 | 9 |
| **Total** | **15** | **21** |

That is **14 required points + the full 5-point bonus cap**, with two additional claimed
points beyond the scoring cap.


### Justification for module choices

The module set follows the shape of a competitive online board game:

- **The game itself** — a *complete web-based game* (Reversi) and *remote players* form the core loop.
- **Making it live** — *real-time WebSockets* power moves, matchmaking, chat, and spectating from a single connection.
- **Trustworthy accounts** — *standard user management* plus *OAuth 2.0* let players own an identity securely.
- **Reasons to interact and return** — *user interaction* (chat/friends/profiles), **game statistics**, **gamification**, **game customization**, and **spectator mode**.
- **Structure & identity** — a *framework on both ends* and a *custom design system* keep the app coherent and maintainable.
- **Performance** — *SSR* delivers server-rendered initial HTML for fast first paints.
- **Reach** — *additional browser* support (Blink + Gecko engines) keeps the game playable beyond Chrome.

### Module of choice — justification (14, custom Minor)

The subject requires custom modules to be explicitly justified:

- **Why we chose it:** instead of sending JSON over a ready-made layer like socket.io, we
  designed our own binary wire protocol from scratch to understand how realtime protocols
  work under the hood.
- **Technical challenges it addresses:** manual big-endian (de)serialization
  (`ByteReader`/`ByteWriter`), a per-stage type-ID namespace (the same numeric ID means
  different things in the auth, lobby, and game stages), length-prefixed strings, compact
  board/move encodings, and an in-band token handshake (browsers cannot set headers on a
  WebSocket upgrade request).
- **Value added:** per-move messages are a handful of bytes instead of JSON payloads; one
  connection cleanly multiplexes matchmaking, friends, chat, and gameplay; and the protocol
  is fully specified in [`docs/WEBSOCKETS.md`](docs/WEBSOCKETS.md) so any client could be
  implemented against it.
- **Why Minor (1 pt):** it is a substantial engineering artifact, but it is the transport
  layer beneath features claimed elsewhere, so we claim it conservatively. It is distinct
  from module 2 (*real-time features*), which is satisfied by the realtime functionality
  itself — this module covers the custom wire-format engineering that an off-the-shelf
  solution would have provided for free.

> **Demo checklist for evaluation:** show statistics, achievements, match history and move review for (8); send a duel with non-default settings for (9); join it from a third account for (10); show persisted XP/level, leaderboard and achievement progress for (11); use `docs/DESIGN_SYSTEM.md` for (12); inspect initial HTML and metadata for (13); inspect binary frames and `docs/WEBSOCKETS.md` for (14); and repeat the core workflow in Firefox and Edge for (15).

---

## Mandatory Requirements Compliance

The subject's general/technical requirements are met as follows:

| Requirement | Status | Where |
|-------------|--------|-------|
| Web app with frontend + backend + database | ✅ | Next.js · Express · PostgreSQL |
| Single-command containerized deploy | ✅ | `make` (Docker Compose: 4 services) |
| HTTPS for all browser↔backend traffic | ✅ | nginx TLS on `:8443`; HTTP `:8080` redirects to HTTPS |
| Credentials in git-ignored `.env` + `.env.example` provided | ✅ | `*.env` in `.gitignore`; `*.env.example` templates |
| Email/password auth with hashed passwords | ✅ | Argon2 (`utils/password-utils.ts`) |
| Frontend **and** backend input validation | ✅ | Zod schemas (backend) + form validation (frontend) |
| Clear DB schema with well-defined relations | ✅ | [`database/schema.sql`](database/schema.sql) |
| CSS framework / styling solution | ✅ | Tailwind CSS (custom retro design system) |
| Multi-user, concurrent, real-time | ✅ | Per-user socket registry; live broadcast to all clients |
| Privacy Policy & Terms of Service pages | ✅ | In-app **Terms & Privacy** page (`app/(logged)/terms`) |
| Commits from all team members, clear messages | ✅ | Git history |

> Responsive design, latest-Chrome compatibility, and a warning-free browser console are
> targeted — verify them live at evaluation. Make sure the Terms/Privacy page is reachable
> from an always-visible link (e.g. a footer) as the subject expects.

---

## Instructions

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Docker Engine** | 24+ | With the **Compose v2** plugin (`docker compose`). |
| **GNU Make** | any recent | Drives the workflow via the `Makefile`. |
| **OpenSSL** | any | Used to generate the self-signed TLS certificate. |
| **Node.js** | 20+ | *Only* needed if you run the apps outside Docker (local dev). |

You also need host ports **8080** and **8443** free. Everything else (Node, Postgres) runs
inside containers.

> **Google login (optional):** to enable Google OAuth you need your own Google Cloud OAuth
> 2.0 credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and an authorized redirect URI
> of `https://localhost:8443/google`. Email/password auth works without them.

### Quick start

```bash
# 1. Clone
git clone https://github.com/juanmipancorbo/transcendence.git
cd transcendence

# 2. Build everything (env files, TLS certs) and start the stack
make
```

`make` runs two steps:

1. **`make setup`** — bootstraps configuration if it's missing:
   - runs `setup-env.sh`, which generates random PostgreSQL and JWT secrets and writes
     `backend/container/.env` and `database/container/.env` from their `.env.example` files;
   - copies `frontend/.env.example` → `frontend/.env`;
   - generates a self-signed TLS certificate into `nginx/certs/`.
2. **`make up`** — builds and starts the four containers (`database`, `backend`, `frontend`,
   `nginx`) in the background, then restarts nginx so it picks up fresh container IPs.

### Access

Open **https://localhost:8443** and accept the self-signed certificate warning.
(HTTP on **http://localhost:8080** redirects to HTTPS.)

For a second computer on the same network, find the server address with `hostname -I` and open
`https://<SERVER_IP>:8443`. REST and WebSocket URLs are same-origin, so no frontend rebuild or
per-machine URL changes are required. Accept the self-signed certificate warning on each browser
and allow TCP ports 8080/8443 through the host firewall if it is enabled. Do not use `localhost`
from the second computer, because it refers to that computer itself.

Google OAuth is configured separately: its redirect URI must exactly match one authorized in Google
Cloud. The default `https://localhost:8443/google` remains suitable for demonstrating OAuth on the
server computer. Using OAuth from other devices requires a stable hostname and matching redirect URI
in Google Cloud and both env files; email/password login and remote gameplay do not have this restriction.

### Environment configuration

Three env files are created from `*.env.example` templates:

- **`backend/container/.env`** — Postgres connection, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`
  (default `15m`), `JWT_REFRESH_EXPIRY` (default `7d`), and the `GOOGLE_*` OAuth values.
- **`database/container/.env`** — `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- **`frontend/.env`** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`,
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`.

> To enable Google login, replace the `GOOGLE_*` placeholders (backend) and
> `NEXT_PUBLIC_GOOGLE_*` values (frontend) with your own credentials.
> The stack and regular username/password authentication work without Google OAuth, but real
> Google credentials must be configured before `make` to demonstrate the OAuth module.

### Useful Make targets

| Command | Description |
|---------|-------------|
| `make` / `make all` | Setup + build + start the full stack. |
| `make up` | Build & start containers (detached). |
| `make down` | Stop and remove containers. |
| `make clean` | `down -v` — also removes volumes (wipes the database). |
| `make re` | `clean` then `up` — full rebuild from scratch. |
| `make seed-db` | Seed the database with fake users/data (uses `@faker-js/faker`). |
| `make drop-db` | Drop game/user data via the backend script. |

### Local development (outside Docker)

```bash
# Backend
cd backend/app && npm install && npm run dev     # tsx watch on :3000

# Frontend
cd frontend && npm install && npm run dev         # next dev on :3000
```

### API & protocol references

- REST + auth endpoints: [`AUTH.md`](AUTH.md) and the Postman collection
  [`Transcendence_Auth_API.postman_collection.json`](Transcendence_Auth_API.postman_collection.json).
- Realtime binary protocol: [`docs/WEBSOCKETS.md`](docs/WEBSOCKETS.md).
- System overview: [`docs/architecture.md`](docs/architecture.md).

---

## Individual Contributions

This breakdown combines the Git history with the team account of collaborative and
AI-assisted work. Commit authorship records who integrated a change; shared design, review,
testing and later ownership are stated separately where relevant.

### intherna — Inti Hernández Servitja

- **Realtime architecture:** designed and implemented the binary WebSocket protocol, socket
  lifecycle, authentication/global/game handler stages, compact readers/writers, matchmaking
  and the GameSession/SessionPlayer model.
- **Session reliability:** implemented turn timing, disconnect/reconnect behavior, session
  restoration after backend restart, current-game recovery, spectator synchronization and
  production frontend deployment.
- **Social backend and realtime flow:** implemented the friend schema and endpoints,
  online/busy/offline presence, the global private-chat protocol and multi-client delivery.
- **Product features:** implemented Google OAuth, configurable friend duels, match-history
  endpoints and UI, and move-by-move game review.
- **Documentation and validation:** documented the WebSocket protocol and architecture and
  performed supplementary Chromium/Zen cross-browser and live-match checks.
- **Main challenge:** keeping database state, in-memory sessions and multiple browser sockets
  consistent through disconnects, reconnections and process restarts.

### jpancorb — Juan Miguel Pancorbo Gutiérrez

- **Core Reversi engine:** designed and implemented board initialization, directional
  capture, legal moves, move application, turn passing, abandonment and winner calculation.
  ChatGPT assisted the implementation; every suggestion was run, inspected and iteratively
  corrected.
- **Game validation:** created manual, complete-match and stress-test scenarios, and repeatedly
  played end-to-end matches to refine scoring, pass turns, natural endings, resignation,
  timers, reconnection, persistence and final results.
- **Retro design system and frontend evolution:** replaced the initial visual direction with
  the current retro pixel-art system and applied it across authentication, lobby, game,
  profiles, leaderboard, legal pages, navigation, notifications and chat. Extracted and
  documented the reusable component system.
- **Progression and profiles:** implemented the leaderboard API/integration, global rank,
  persisted biography, achievements, completed-game views and multiple statistics/XP fixes.
- **Social and game-flow stabilization:** completed the friend-request UI and private chat,
  profile navigation, unread/presence behavior, game/spectator chat edge cases, current-game
  result recovery and responsive behavior.
- **Compatibility and documentation:** performed the full Chrome/Firefox/Edge workflow and
  console audit, documented browser coverage, and iteratively validated product behavior as
  Product Owner.
- **Main challenge:** turning server-authoritative binary game events into a clear,
  synchronized UI while preserving correct behavior through every game-ending path.

### cmarrued — Carlos Marruedo

- **Frontend foundation:** created the initial Next.js application, routes, Tailwind setup,
  shared layout and first versions of login, registration, lobby, game, profile and
  leaderboard pages. The initial visual direction and mockups were generated with Google
  Stitch, then integrated and adapted into the application by cmarrued.
- **Gameplay client:** connected the board to realtime state, corrected move rendering and
  valid-move interaction, added the match log, remaining-turn timer and resignation handling.
- **Social frontend:** added public friend profiles, friend actions and the initial in-game
  chat experience.
- **Spectator experience:** implemented and stabilized entry into live games, spectator UI
  behavior and error handling for invalid or completed matches.
- **Authentication lifecycle:** fixed client access-token refresh behavior and protected-page
  continuity.
- **Main challenge:** progressively replacing mock frontend data with authenticated REST and
  WebSocket state without breaking the existing navigation and game screen.

### anguil-l — Antonio Guil Luque

- **Authentication foundation:** implemented registration/login, Argon2 password hashing,
  JWT access and refresh tokens, persisted refresh sessions, auth middleware and validation.
- **Security hardening:** separated token types, corrected refresh behavior and documented the
  authentication API in AUTH.md and the Postman collection.
- **Main challenge:** designing short-lived access tokens and revocable refresh sessions that
  cannot be used interchangeably.

### pmorello — Pau Anand Morello

- **Avatar pipeline:** implemented profile-avatar upload across frontend and backend,
  authenticated multipart handling, profile refresh and avatar persistence.
- **Repository cleanup:** removed stray Windows Zone.Identifier artifacts from the repository.
- **Inherited ownership:** after mvelazqu left the team, became the current maintenance and
  evaluation owner for Docker, nginx, Makefile and the initial database-service foundation.
  This responsibility requires reviewing, testing and explaining that area and does not
  replace mvelazqu as its original author. Before evaluation, pmorello will validate a clean
  deployment and document the operational flow.

### mvelazqu — Maximiliano Velázquez (former member)

- **Infrastructure foundation:** created the Docker/Compose service structure, backend
  Dockerfile, PostgreSQL initialization, health checks, Makefile workflow and environment
  setup for 42 machines.
- **Backend and database foundation:** implemented the initial user/game data model,
  repositories and services, game-management endpoints, seed/reset scripts and centralized
  ApiError middleware.
- **Handover:** left the team before completion. His work remains attributed to him; current
  maintenance and evaluation ownership of this area was assigned to pmorello.

---

## Resources

### References & documentation
- **Reversi / Othello rules** — [World Othello Federation rules](https://www.worldothello.org/about/about-othello/othello-rules/official-rules/english)
  and the [Reversi Wikipedia article](https://en.wikipedia.org/wiki/Reversi).
- **Next.js** — <https://nextjs.org/docs> (App Router).
- **React** — <https://react.dev/>.
- **Tailwind CSS** — <https://tailwindcss.com/docs>.
- **Express** — <https://expressjs.com/> and **`express-ws`** — <https://github.com/HenningM/express-ws>.
- **WebSockets** — [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
  and the [`ws`](https://github.com/websockets/ws) library.
- **PostgreSQL** — <https://www.postgresql.org/docs/> (composite types, arrays, PL/pgSQL
  functions & triggers).
- **JSON Web Tokens** — [jwt.io](https://jwt.io/) and [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519).
- **Argon2 password hashing** — <https://github.com/ranisalt/node-argon2>.
- **Zod** — <https://zod.dev/>.
- **Google OAuth 2.0** — <https://developers.google.com/identity/protocols/oauth2>.
- **Docker Compose** — <https://docs.docker.com/compose/>.
- **nginx reverse proxy / WebSocket proxying** — <https://nginx.org/en/docs/>.

### How AI was used

AI assistants, including **OpenAI ChatGPT**, **OpenAI Codex**, **Anthropic's Claude via
Claude Code**, and **Google Stitch**, were used as accelerators, **not** as replacements for
the team's own design and implementation decisions. Specifically:

- **Documentation** — drafting and polishing the project docs (this `README.md`,
  `docs/architecture.md`, `docs/WEBSOCKETS.md`, `AUTH.md`) from the actual source code and
  git history.
- **Initial frontend direction** — Google Stitch generated the first Velocity Noir visual
  mockups. cmarrued integrated and adapted them into the initial Next.js frontend; the team
  later replaced that direction with the current retro design system.
- **Design review & rubber-ducking** — sanity-checking the WebSocket protocol design, the
  server-authoritative move flow, and the crash-recovery approach.
- **Core game logic** — ChatGPT assisted jpancorb with the Reversi rule engine,
  complete-match tests and stress scenarios. Suggestions were executed, reviewed and
  iteratively corrected through automated checks and manual games.
- **SQL** — reviewing the PL/pgSQL functions and triggers (XP↔level conversion, canonical
  friend/chat ordering, `report_game`).
- **Debugging assistance** — investigating specific bugs and edge cases.
- **Implementation support** — preparing scoped patches for review, responsive UI fixes,
  and focused verification after the team selected the intended behavior.

All AI-assisted output was reviewed, tested, and integrated by the team; game rules,
architecture, and the final code are the team's own work.

---

## Known Limitations

- The bundled TLS certificate is **self-signed**, so browsers show a security warning on first
  visit (expected for local development).
- Google OAuth requires your own credentials to function; the shipped values are placeholders.
- Matchmaking uses a single casual queue (no ranked ladder or tournament brackets).
- A disconnected player has a **60-second** reconnect grace period before a game is
  auto-abandoned.

---

## License

Released under the **ISC License** (see the backend `package.json`), created for educational
purposes as part of the 42 curriculum.
