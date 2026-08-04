# Realtime WebSocket Protocol

## Overview

The realtime subsystem exposes a **single** WebSocket endpoint, `/ws/create`. A connection is wrapped in a `Socket` class (`logic/sync/socket.ts`) that holds a raw `ws.WebSocket`, dispatches incoming messages to a swappable handler, and enforces a keep-alive timeout.

Every connection moves through up to three handler stages during its lifetime:

1. **Auth handler** — the socket is unauthenticated. The first message must carry a valid access token. On success the socket is registered and promoted to the global handler.
2. **Global handler** — the "lobby". Handles matchmaking, friend requests, direct chat, and joining a game.
3. **Game handler** — active once the socket has joined a `GameSession`. Handles moves, readiness, in-game chat, and forfeits.

All messages are **binary**. The first byte of every message is the **type ID** — a `uint8` that identifies the message type within the handler that is currently active. Subsequent bytes carry payload data specific to that type. Because the type-ID namespace is per-handler, the same numeric ID means different things in the auth, global, and game stages.

> Through the nginx gateway the endpoint is reached at `wss://localhost:8443/api/ws/create` (the `/api/` prefix is stripped before the request reaches the backend on `:3000`).

---

## Connection Flow

### Stage 1 — Authentication

The client connects to `/ws/create` and immediately sends an **Auth** message: type ID `0` (`Token`) followed by the access token as a prefixed UTF-8 string.

- On a valid token: the server sets the socket's user ID from the token payload, marks it authenticated, registers it in the connected-users map, promotes it to the **global handler**, and sets its status to `online`.
- On a missing/invalid/expired token or a malformed payload: the socket is closed with close code `4444` (`CloseCodes.Error`).

The access token is the same JWT issued by `POST /auth/login` / `/auth/register` (see `AUTH.md`).

```
Client                              Server
   |                                   |
   |-- WS /ws/create ----------------->|
   |-- Auth: Token(0) + <accessToken>->|
   |                                   |-- verifyAccessToken()
   |                                   |-- registerSocket(), status = online
   |<-- [now in global/lobby mode] ----|
```

---

### Stage 2 — Lobby (global handler)

Once authenticated, the socket lives in the lobby. From here the user can enter matchmaking, manage friend requests, send direct chat messages, and join an existing game. The client must keep sending `KeepAlive` (`0`) at least every 20 seconds throughout.

**Matchmaking** uses a single global waiting slot (one casual queue):

- `JoinCasualQueue` (`1`): the server first checks the DB to ensure the user is not already in a game. If nobody is waiting, this socket becomes the waiting player and its status is set to `busy`. If a different user is already waiting, a `GameSession` is created immediately for the two of them and both receive `MatchFound` (`8`) with the `gameId` and the opponent's user ID.
- `LeaveQueue` (`2`): clears the waiting slot if it belongs to this user.

The waiting slot is also cleared automatically if the waiting socket closes or errors.

```
Client A                          Server                         Client B
   |                                 |                                |
   |-- JoinCasualQueue (1) --------->|                                |
   |   (nobody waiting)              |-- A becomes waiting, busy      |
   |                                 |<-- JoinCasualQueue (1) --------|
   |                                 |   (A is waiting)               |
   |                                 |-- createGameSession(A, B) ---> |
   |<-- MatchFound(8, gameId, B.id) -|                                |
   |                                 |-- MatchFound(8, gameId, A.id)->|
```

Unlike the previous protocol, the lobby connection is **not** closed after a match is found — the same socket is reused. Each client then sends `JoinGame` (`7`) to enter the session.

---

### Stage 3 — Joining the game

The client sends `JoinGame` (`7`) with the `gameId` (prefixed UTF-8). The server looks the session up in the in-memory `SESSIONS` map:

- If no session exists for that ID, the server replies with a `FatalError` (game-mode type `25`) and the socket stays in the lobby.
- If the socket's status is `busy` but the user is neither the black nor white player of that game (i.e. still queued elsewhere), it is rejected with a `FatalError`.
- Otherwise the socket is switched to the **game handler**, its status is set to `busy`, and `game.joinGame` runs.

**`joinGame` behavior:**
- If the user is the white or black player, the socket is added to that `SessionPlayer`'s connection set.
- If the user is neither player and the game allows spectators, the socket joins as a spectator (and a `SpectatorJoin` is broadcast).
- If the game is already finished/abandoned, or spectators are not allowed, `joinGame` returns an `Error`, the socket is reverted to the lobby handler, and a `FatalError` is sent.

On a successful join the server immediately sends a `State` (`19`) snapshot to the joining connection.

**One player, many connections.** A `SessionPlayer` accepts **any number of simultaneous connections** from the same user ID (multiple tabs, or a reconnect before the old socket times out). Every connection sharing a player receives the same broadcasts.

```
Client A                          Server
   |                                 |
   |-- JoinGame (7, gameId) -------->|
   |                                 |-- SESSIONS.get(gameId)
   |                                 |-- game.joinGame(sock) -> SessionPlayer[A].conn.add(sock)
   |<-- State (19) ------------------|
   |   (now in game mode)            |
```

---

### Stage 4 — Ready handshake & gameplay

After joining, a client sets up its local board UI and sends `Ready` (`2`). When **both** players are ready, the server sets the game to `ACTIVE`, broadcasts `GameStart` (`21`), records the start time, and begins the first turn (`BlackTurn`, since BLACK always moves first).

```
Client A                          Server                         Client B
   |                                 |                                |
   |-- Ready (2) ------------------->|                                |
   |                                 |<-- Ready (2) ------------------|
   |                                 |  (both players ready)          |
   |<-- GameStart (21) --------------|-- GameStart (21) ------------->|
   |<-- BlackTurn (6, moves) --------|-- BlackTurn (6, moves) ------->|
```

During play, the mover sends `ConsumeTurn` (`1`, row + col). The server validates the move with the Reversi engine, broadcasts a `MoveUpdate` (`20`) with the changed cells, persists the move, and then issues the next `BlackTurn`/`WhiteTurn` (or a `*NoMoves` if the side to move must pass). Chat during a game uses `ChatMessage` (`3`).

---

### Full Flow Summary

```
[AUTH]
  Connect /ws/create
    → send Token(0) + accessToken
    → on success: promoted to lobby, status = online

[LOBBY]
  send KeepAlive(0) periodically
  send JoinCasualQueue(1) → become waiting OR get MatchFound(8)
  (also: LeaveQueue, friend requests, direct chat here)

[JOIN]
  send JoinGame(7, gameId)
    → switched to game handler, status = busy
    → receive State(19) snapshot

[READY]
  send Ready(2)
    → server waits for both players ready
    → broadcasts GameStart(21), then BlackTurn(6)

[GAMEPLAY]
  send ConsumeTurn(1, row, col) on your turn
  send ChatMessage(3) for in-game chat
  server sends MoveUpdate(20), BlackTurn/WhiteTurn, *NoMoves, etc.

[END]
  server sends GameEnd(22) (+ XpUpdate(23) to the winner of a ranked game)
  send Abandon(16) to forfeit intentionally
  a dropped/closed socket triggers a 60s reconnect grace, then auto-abandon
```

---

## Endpoint

### `WS /ws/create`

**Auth:** performed in-band as the first message (Token handshake), **not** via HTTP middleware.

Registered directly in `index.ts` as `app.ws("/ws/create", create)`. The `create` function (`websockets.ts`) wraps the raw socket in a `Socket` and installs the auth handler; on a successful token handshake it swaps in the global handler.

There are no query parameters — the game to join is selected later via the `JoinGame` lobby message rather than a URL parameter.

---

## Socket Lifecycle

Defined in `logic/sync/socket.ts`.

```
connect → auth handler → (token ok) → global handler → (JoinGame) → game handler
                                                    ↘ keep-alive timeout / close / error → cleanup
```

**Keep-alive:** the client must send a `KeepAlive` (`0`) at least every **20 seconds**. Each one resets the timeout. If the timeout fires, the socket is closed and, if it was in a game, `game.playerDisconnect` is called.

**Connected-users registry:** on auth, the socket is added to a module-level `Map<userId, Set<Socket>>`. This is what lets the lobby push friend-request and chat notifications to every device a user has online, and what powers the `injectStatus` helper that stamps `online`/`busy`/`offline` onto user profiles returned by the REST API.

**Status:** each socket carries a status of `offline` | `online` | `busy`. It becomes `online` on auth, `busy` while queued or in a game, and back to `online` when it returns to the lobby.

**Close / error handling:**
- If the socket was the waiting queue player, the waiting slot is cleared.
- If the socket belonged to a game, `game.playerDisconnect` is called.
- The socket is removed from the connected-users registry.

**Intentional forfeit vs. drop:** forfeiting is done by sending an `Abandon` (`16`) game-mode message, not by using a special WebSocket close code. Any raw close or error is treated as a disconnect, which starts a **60-second reconnect grace period** (`RECONNECT_TIME_MS`) before the game is auto-abandoned.

**Handler:** `Socket.handler` is `(data: RawData, conn: Socket) => void`, swapped as the socket moves between stages. If no handler is set, incoming messages are ignored.

---

## Protocol Reference

### Auth Handler (`logic/sync/handlers/auth-handler.ts`)

| Type ID | Name    | Direction       | Payload                     | Description |
|---------|---------|-----------------|-----------------------------|-------------|
| `0`     | `Token` | client → server | `accessToken (prefixed UTF-8)` | Authenticates the socket. On success it is promoted to the global handler; on failure the socket is closed with code `4444`. |

---

### Global Handler / Lobby (`logic/sync/handlers/global-handler.ts`)

**Error codes** (trailing `uint8` on `Error` messages): `Generic = 0`, `FriendReqFailed = 1`, `QueueFailed = 2`.

#### Client → Server

| Type ID | Name              | Payload | Description |
|---------|-------------------|---------|-------------|
| `0`     | `KeepAlive`       | none    | Resets the 20s disconnect timeout. |
| `1`     | `JoinCasualQueue` | none    | Enter matchmaking. Rejected (via `Error`) if already in a game. |
| `2`     | `LeaveQueue`      | none    | Leave matchmaking if currently the waiting player. |
| `3`     | `FriendReqSend`   | `targetUserId (prefixed UTF-8)` | Send a friend request. |
| `4`     | `FriendReqReject` | `senderUserId (prefixed UTF-8)` | Reject an incoming friend request. |
| `5`     | `FriendReqAccept` | `senderUserId (prefixed UTF-8)` | Accept an incoming friend request. |
| `6`     | `Chat`            | `targetUserId (prefixed UTF-8)` + `message (prefixed UTF-8)` | Send a direct chat message to a friend (rejected if the recipient is in a game). |
| `7`     | `JoinGame`        | `gameId (prefixed UTF-8)` | Join an existing session; switches this socket to the game handler. |

#### Server → Client

| Type ID | Name            | Payload | Description |
|---------|-----------------|---------|-------------|
| `3`     | `FriendReqSend` | `fromUserId (prefixed UTF-8)` | Pushed to a user when someone sends them a friend request. |
| `6`     | `Chat`          | `senderUserId (prefixed UTF-8)` + `message (prefixed UTF-8)` | Pushed to a user when a friend sends them a direct message. |
| `8`     | `MatchFound`    | `gameId (prefixed UTF-8)` + `opponentId (prefixed UTF-8)` | A match was made; follow up with `JoinGame`. |
| `9`     | `Info`          | `message (prefixed UTF-8)` | Informational notice (e.g. "Friend request sent"). |
| `10`    | `Error`         | `message (prefixed UTF-8)` + `code (uint8)` | A recoverable lobby error, tagged with a `ProtocolCodes` value. |
| `11`    | `Notification`  | reserved | Defined but not currently emitted. |

> Type IDs `3` and `6` are used in **both** directions: the client uses them to act, and the server reuses the same ID to notify the counterpart.

---

### Game Handler (`logic/sync/handlers/game-handler.ts`)

Active once the socket has joined a `GameSession`. Only `KeepAlive`, `ConsumeTurn`, `Ready`, `ChatMessage`, `Abandon`, and `Disconnect` are accepted from the client — and everything except `KeepAlive` requires the socket to be attached to an active `SessionPlayer`/game. All other IDs are server-to-client.

#### Client → Server

| Type ID | Name          | Payload | Description |
|---------|---------------|---------|-------------|
| `0`     | `KeepAlive`   | none    | Resets the 20s disconnect timeout. |
| `1`     | `ConsumeTurn` | `row: uint8`, `col: uint8` | Submit a move. Validated server-side; rejected with `Error` if it is not your turn. |
| `2`     | `Ready`       | none    | Signal readiness. When both players are ready the game starts. Also clears a pending reconnect timer. |
| `3`     | `ChatMessage` | `message (prefixed UTF-8)` | Send an in-game chat message. |
| `16`    | `Abandon`     | none    | Intentionally forfeit (or, for a spectator, leave the game). |
| `17`    | `Disconnect`  | none    | Voluntarily disconnect this connection from the game. |

#### Server → Client

| Type ID | Name             | Payload | Description |
|---------|------------------|---------|-------------|
| `4`     | `SpectatorJoin`  | `specId (prefixed UTF-8)` | A spectator joined. |
| `5`     | `SpectatorLeave` | `specId (prefixed UTF-8)` | A spectator left. |
| `6`     | `BlackTurn`      | `timeToLose: int32`, `count: uint32`, then `count × (row: uint8, col: uint8)` | It is BLACK's turn; carries BLACK's remaining time (ms, `-1` if untimed) and BLACK's valid moves. |
| `7`     | `WhiteTurn`      | `timeToLose: int32`, `count: uint32`, then `count × (row: uint8, col: uint8)` | It is WHITE's turn; same layout as `BlackTurn`. |
| `8`     | `BlackNoMoves`   | none | BLACK has no valid moves and must pass. |
| `9`     | `WhiteNoMoves`   | none | WHITE has no valid moves and must pass. |
| `10`    | `BlackAbandon`   | none | BLACK abandoned the game. |
| `11`    | `WhiteAbandon`   | none | WHITE abandoned the game. |
| `12`    | `BlackDisconnect`| `reconnectTimeMs: uint32` | BLACK's last connection dropped; grace period before auto-abandon. |
| `13`    | `WhiteDisconnect`| `reconnectTimeMs: uint32` | WHITE's last connection dropped; grace period before auto-abandon. |
| `14`    | `BlackReconnect` | none | BLACK reconnected within the grace period. |
| `15`    | `WhiteReconnect` | none | WHITE reconnected within the grace period. |
| `18`    | `Board`          | `board` | Full board state (rarely sent standalone; `State` carries the board on join). |
| `19`    | `State`          | see below | Full game snapshot, sent to a connection when it joins. |
| `20`    | `MoveUpdate`     | `count: uint32`, then `count × (content: uint8, row: uint8, col: uint8)` | The cells that changed as a result of a move. |
| `21`    | `GameStart`      | none | Both players ready; the game is now active. |
| `22`    | `GameEnd`        | `winner: uint8` (`0` = draw/none, `1` = BLACK, `2` = WHITE) | The game ended. |
| `23`    | `XpUpdate`       | `newXp: uint32` | Sent to the winner of a ranked game with their new XP total. |
| `24`    | `Error`          | `message (prefixed UTF-8)` | A recoverable in-game error (e.g. "It's not your turn"). |
| `25`    | `FatalError`     | `message (prefixed UTF-8)` | A fatal error (e.g. game not found / cannot join). |

**`State` (`19`) payload layout:**

```
gameId          : prefixed UTF-8
board           : board (see Binary Encoding)
as              : uint8   (viewer's side: 1 = BLACK, 2 = WHITE, other = spectator)
whitePlayerId   : prefixed UTF-8
blackPlayerId   : prefixed UTF-8
timeLimit       : int32   (seconds, -1 = unlimited)
blackTimeLeft   : int32   (milliseconds, -1 = unlimited)
whiteTimeLeft   : int32   (milliseconds, -1 = unlimited)
status          : prefixed UTF-8  (WAITING | ACTIVE | FINISHED | ABANDONED)
allowSpectators : bool    (1 byte)
-- only if status == ACTIVE: --
currentTurn     : uint8
startedAt       : uint32  (unix seconds)
-- only if it is the viewer's turn: --
count           : uint8
count × (row: uint8, col: uint8)   -- the viewer's valid moves
```

---

## Binary Encoding

All multi-byte integers are **big-endian**, implemented in `logic/sync/stream-utils/reader.ts` (`ByteReader`) and `writer.ts` (`ByteWriter`).

- **`uint8`** — 1 byte, unsigned.
- **`bool`** — 1 byte (`0` = false, non-zero = true).
- **`int32` / `uint32`** — 4 bytes, big-endian.
- **Prefixed UTF-8 string** — a `uint32` byte-length prefix followed by that many UTF-8 bytes.
- **Board** — a `uint32` height and a `uint32` width, followed by `height × width` `uint8` cells (`0` = empty, `1` = BLACK, `2` = WHITE).

Every message begins with a `uint8` type ID; the remaining bytes are that type's payload.

---

## File Structure

```
logic/
├── game.ts                          # Reversi engine (board, valid moves, apply move, game-over)
└── sync/
    ├── session.ts                   # GameSession, SessionPlayer, SESSIONS map,
    │                                #   createGameSession(), restoreUnfinishedSessions() (crash recovery)
    ├── socket.ts                    # Socket wrapper, keep-alive, connected-users registry, CloseCodes
    ├── protocol-utils.ts            # build* helpers that serialize outgoing frames
    ├── handlers/
    │   ├── auth-handler.ts          # Auth handshake (Token) + Protocol enum
    │   ├── global-handler.ts        # Lobby: queue, friends, chat, join game + Protocol/ProtocolCodes enums
    │   └── game-handler.ts          # In-game protocol + Protocol enum
    └── stream-utils/
        ├── reader.ts                # ByteReader — deserialize incoming binary frames
        └── writer.ts                # ByteWriter — serialize outgoing binary frames

websockets.ts                        # create(): wires a new Socket to the auth handler
```

---

## Persistence & Crash Recovery

`GameSession` state lives in memory (`SESSIONS`), but every game and every move is also written to PostgreSQL (`games` table, with a `moves move[]` column) as it happens. On startup, `restoreUnfinishedSessions()` reloads unfinished games from the database and replays their stored moves to rebuild each `GameSession`, so an in-progress match survives a backend restart. A restored session that neither player rejoins within a generous timeout is finished automatically.
