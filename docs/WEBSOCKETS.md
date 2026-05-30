# Matches WebSocket Protocol

## Overview

The matches subsystem exposes two WebSocket endpoints under `/matches`. Connections are managed through a `Socket` class that wraps a raw `ws.WebSocket`, attaches a message handler, and enforces a keep-alive timeout. Depending on the endpoint and game state, a socket operates in one of two modes: **queue mode** or **game mode**.

All messages are binary, framed as a sequence of bytes. The first byte of every message is the **type ID** — a `uint8` that identifies the message type within the current protocol context. Subsequent bytes carry payload data specific to that type.

---

## Connection Flow

### Phase 1 — Matchmaking (`/matches/quickplay`)

A client connects to `/matches/quickplay` to enter the queue. The socket is held open in queue mode while waiting. Two outcomes are possible:

**If no opponent is waiting:** the socket is stored as the pending player and stays open. The client should send periodic `KeepAlive` (`0`) messages to avoid the 20-second timeout.

**If an opponent is already waiting:** the server creates a `GameSession` immediately. Both sockets receive a `MatchFound` (`1`) message containing the `gameId` and the opponent's user ID. **The quickplay connection is then closed by the server** — it is not reused for gameplay. The `gameId` from this message is what the client needs for the next phase.

```
Client A                          Server                         Client B
   |                                 |                                |
   |-- WS /matches/quickplay ------->|                                |
   |   (queue is empty)              |-- stored as pending ---------> |
   |<-- KeepAlive loop ------------->|                                |
   |                                 |<-- WS /matches/quickplay ------|
   |                                 |   (queue occupied)             |
   |                                 |-- createGameSession() -------> |
   |<-- MatchFound(gameId, B.id) ----|                                |
   |                                 |---- MatchFound(gameId, A.id) ->|
   |<-- [connection closed] ---------|---- [connection closed] ------>|
```

---

### Phase 2 — Joining the Game (`/matches/join`)

After receiving `MatchFound` and the quickplay connection closes, each client connects to `/matches/join?gameId=<gameId>`.

**Player profiles exist before any connection arrives.** When `createGameSession` runs, it creates a `SessionPlayer` profile for each user ID inside the `GameSession`. These profiles are not tied to any socket — they are placeholders that track game state, readiness, and the set of connections belonging to that player.

A `SessionPlayer` accepts **any number of simultaneous connections** from the same authenticated user ID. This means a player can open multiple `/matches/join` connections (e.g. multiple tabs or a reconnect before the old socket times out) and all will be associated with the same profile. Every connection sharing a profile will receive the same server-to-client messages.

If `joinGame` rejects the connection (wrong user, game full, invalid state), the socket is closed immediately with close code `Error` (`17`).

```
Client A                          Server
   |                                 |
   |-- WS /matches/join?gameId= ---->|
   |   (auth: A's token)             |-- game.joinGame(socketA) -----> SessionPlayer[A].addConnection(socketA)
   |<-- [now in game mode] ----------|
```

---

### Phase 3 — Ready Handshake

Once connected via `/matches/join`, a client should set up its local game state (load the board UI, initialize rendering, etc.) and then send a `Ready` (`2`) packet.

The game starts when **both players have sent `Ready` and each player has at least one active connection**. The server then broadcasts `GameStart` (`15`) to all connections of both players.

```
Client A                          Server                         Client B
   |                                 |                                |
   |-- Ready (type 2) -------------->|                                |
   |                                 |<-- Ready (type 2) -------------|
   |                                 |  (both ready + both connected) |
   |<-- GameStart (type 15) ---------|-- GameStart (type 15) -------->|
   |<-- Board (type 12) -------------|-- Board (type 12) ------------>|
   |<-- YourTurn/OpponentTurn -------|-- OpponentTurn/YourTurn ------>|
```

---

### Full Flow Summary

```
[MATCHMAKING]
  Client connects to /matches/quickplay
    → waits in queue (send KeepAlive periodically)
    → receives MatchFound(gameId, opponentId)
    → quickplay connection closes

[JOIN]
  Client connects to /matches/join?gameId=<gameId>
    → associates with existing SessionPlayer profile
    → multiple connections from same user ID are all accepted

[READY]
  Client sends Ready (type 2)
    → server waits for both players to be connected + ready
    → server sends GameStart to all connections

[GAMEPLAY]
  Client sends ConsumeTurn(row, col) on their turn
  Client sends ChatMessage for chat
  Server sends Board, MoveUpdate, YourTurn, OpponentTurn, etc.

[END]
  Server sends GameEnd
  Client closes with PlayerAbandon (type 10) to forfeit intentionally
  Any other close/error is treated as a disconnect
```

---

## Endpoints

### `WS /matches/quickplay`

**Auth required:** yes (via `authMiddleware`)

Enters the authenticated user into the matchmaking queue. If no other player is waiting, the connection is held open in queue mode. If a player is already waiting, a game session is created immediately and both sockets are transitioned to game mode.

**Pre-connection validation (HTTP middleware):**
- Returns `400` if the user is already in the queue (same user ID already holds the `quickplay` slot).

**Behavior on connect:**
- If the queue is empty: socket is assigned the `queueHandler` and stored as the pending player.
- If the queue is occupied: a `GameSession` is created for both players, both sockets are transitioned to `gameHandler`, and each receives a `MatchFound` (type `1`) message containing the game ID and the opponent's user ID. The queue slot is cleared.

---

### `WS /matches/join`

**Auth required:** yes (via `authMiddleware`)

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameId`  | UUID | yes      | ID of the game session to join |

**Pre-connection validation (HTTP middleware):**
- Returns `400` if `gameId` is missing or not a valid UUID.
- Returns `404` if no active session exists for that `gameId`.

**Behavior on connect:**
- Wraps the raw WebSocket in a `Socket` and calls `game.joinGame(client)`.
- If `joinGame` returns an `Error`, the socket is closed immediately with `GameProtocol.Error` (`17`) as the close code and the error message as the reason.

---

## Socket Lifecycle

Defined in `sync/socket.ts`.

```
connect → resetTimeout (20s) → [messages routed to handler] → disconnect
```

**Keep-alive:** The client must send a `KeepAlive` (`0`) message at least once every **20 seconds**. Each `KeepAlive` resets the timeout. If the timeout fires, the socket is closed and the game (if any) is notified via `playerDisconnect`.

**Close events:**
- Close code `PlayerAbandon` (`10`): treated as an intentional forfeit — calls `game.playerAbandon`.
- Any other close: treated as a drop — calls `game.playerDisconnect`.
- Error event: treated as a drop — calls `game.playerDisconnect`.

**Handler:** `Socket.handler` is a function `(data: RawData, conn: Socket) => void`. It is swapped out as the socket transitions between modes. If no handler is set, incoming messages are silently ignored.

---

## Protocol Modes

### Queue Mode (`sync/handlers/queue-handler.ts`)

Active while a player is waiting for a match on `/matches/quickplay`.

| Type ID | Name             | Direction      | Payload | Description |
|---------|------------------|----------------|---------|-------------|
| `0`     | `KeepAlive`      | client → server | none    | Resets the 20s disconnect timeout. |
| `1`     | `MatchFound`     | server → client | `gameId (prefixed UTF-8)` + `opponentId (prefixed UTF-8)` | Sent when a match is made. Transitions the socket to game mode. |
| `2`     | `MatchmakeError` | server → client | TBD     | Reserved for matchmaking errors. |

The queue handler only processes `KeepAlive`. `MatchFound` and `MatchmakeError` are outbound-only, sent by the server when pairing players.

---

### Game Mode (`sync/handlers/game-handler.ts`)

Active once a player is inside a `GameSession`, covering both `/matches/quickplay` (after match is found) and `/matches/join`.

#### Client → Server

| Type ID | Name           | Payload | Description |
|---------|----------------|---------|-------------|
| `0`     | `KeepAlive`    | none    | Resets the 20s disconnect timeout. |
| `1`     | `ConsumeTurn`  | `row: uint8`, `col: uint8` | Submit a move at the given board position. Only processed if the socket has an active `SessionPlayer`. |
| `2`     | `Ready`        | none    | Signal that the player is ready to start. Calls `game.playerReady`. |
| `3`     | `ChatMessage`  | `message: prefixed UTF-8` | Send a chat message to the opponent. Calls `game.chat`. |

#### Server → Client

| Type ID | Name              | Description |
|---------|-------------------|-------------|
| `4`     | `SpectatorJoin`   | A spectator has joined. |
| `5`     | `SpectatorLeave`  | A spectator has left. |
| `6`     | `YourTurn`        | It is this player's turn. |
| `7`     | `OpponentTurn`    | It is the opponent's turn. |
| `8`     | `NoMoves`         | This player has no valid moves. |
| `9`     | `OpponentNoMoves` | The opponent has no valid moves. |
| `10`    | `PlayerAbandon`   | Used as a WebSocket close code when this player abandons. |
| `11`    | `OpponentAbandon` | The opponent has abandoned the game. |
| `12`    | `Board`           | Full board state. |
| `13`    | `State`           | Game state update. |
| `14`    | `MoveUpdate`      | A move was applied to the board. |
| `15`    | `GameStart`       | The game has started (both players ready). |
| `16`    | `GameEnd`         | The game has ended. |
| `17`    | `Error`           | Send whatever error message, also used as a WebSocket close code on fatal errors. |

---

## Binary Encoding

All messages use a simple big-endian binary format implemented in `sync/stream-utils/reader.ts` and `sync/stream-utils/writer.ts`.

- **`uint8`** — 1 byte, unsigned.
- **Prefixed UTF-8 string** — length-prefixed UTF-8 encoded string (see `ByteReader.readPrefixedUTF` / `ByteWriter` equivalent).

Every message begins with a `uint8` type ID. The remaining bytes are the payload for that type.

---

## File Structure

```
├── game.ts                          # Game logic (Position, board)
└── sync/
    ├── session.ts                   # GameSession, SessionPlayer
    ├── socket.ts                    # Socket wrapper, keep-alive, handler dispatch
    ├── protocol-utils.ts            # Shared protocol helpers (e.g. buildMatchFound)
    ├── game-callbacks.ts            # (internal) game event callbacks
    ├── handlers/
    │   ├── game-handler.ts          # Game mode protocol + Protocol enum
    │   ├── queue-handler.ts         # Queue mode protocol + Protocol enum
    │   └── global-handler.ts        # (reserved, currently empty)
    └── stream-utils/
        ├── reader.ts                # ByteReader — deserialize incoming binary frames
        └── writer.ts                # ByteWriter — serialize outgoing binary frames
```
