# Authentication - Backend

## Overview

The backend implements JWT authentication. Users can register with email/password or via Google OAuth, log in, and access protected routes. Passwords are hashed with Argon2. Session refresh tokens are stored in the database hashed with SHA256.

## Endpoints

Email/password endpoints live under `/auth`; Google login lives under `/google`.

> Through the nginx gateway the API is served under `/api` (e.g. `POST /api/auth/login`). The `/api` prefix is stripped before the request reaches the backend.

### POST /auth/register
Registers a new user and returns tokens (it logs the user in automatically).

Validation rules (Zod, `users-request.ts`):
- `email`: valid email
- `username`: 3–16 characters; letters, numbers, hyphen (`-`) and underscore (`_`) only
- `password`: 8–64 characters, with at least one lowercase letter, one uppercase letter, one digit, and one symbol

Request:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "accessToken": "token",
    "refreshToken": "token"
  }
}
```

If the email or username already exists, responds `409` with `{ "success": false, "error": "Email or username is already taken" }`.

### POST /auth/login
Logs in an existing user.

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response (200): same shape as `register` (a `data` object with `user`, `accessToken`, and `refreshToken`).

Invalid credentials → `401` with `{ "success": false, "error": "Invalid credentials" }`.

### POST /google/login
Login/registration via Google OAuth. The frontend obtains a `code` from Google and sends it here; the backend exchanges it for the user's profile, creates the account if it does not exist (`account_host = 'google'`), and returns tokens.

Request:
```json
{
  "code": "google_authorization_code",
  "redirect": "https://localhost:8443/google"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "username": "...", "...": "FullUser" },
    "accessToken": "token",
    "refreshToken": "token"
  }
}
```

Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend environment. The redirect URI is sent by the frontend and must match the URI configured in Google.

### GET /auth/me
Returns the full profile of the authenticated user. Requires the `Authorization: Bearer <accessToken>` header.

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "avatarUrl": "https://...",
    "bio": "",
    "status": "online",
    "currentGame": null,
    "gamesPlayed": 0,
    "gamesWon": 0,
    "gamesLost": 0,
    "xp": 0,
    "level": 0,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/refresh
Generates a new access token using the refresh token. No authorization header required; the refresh token goes in the body.

Request:
```json
{
  "refreshToken": "token"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "token"
  }
}
```

The refresh token must exist (hashed) in the DB; otherwise it responds `401`.

### POST /auth/logout
Invalidates the current session. **Requires** the `Authorization: Bearer <accessToken>` header **and** the `refreshToken` in the body (the corresponding session is deleted from the DB).

Request:
```json
{
  "refreshToken": "token"
}
```

Response (200):
```json
{
  "success": true,
  "data": null
}
```

## Middleware

The `authMiddleware` middleware (`src/middleware/auth-middleware.ts`) protects routes. To use it:

```typescript
import { authMiddleware } from "../../middleware/auth-middleware";
import { Router } from "express";

const router = Router();

router.get("/protected-route", authMiddleware, (req, res) => {
  console.log(req.userId); // userId available here
  console.log(req.user);   // token payload: { id, email, username }
});
```

The middleware:
- Validates the `Authorization: Bearer <token>` header
- Verifies the JWT signature and that it is an `access` token
- Returns `401` if the token is invalid or missing
- Attaches `userId` (string) and `user` (token payload) to the `req` object

## Security

- Passwords are hashed with **Argon2** (`argon2`).
- Access tokens expire based on `JWT_ACCESS_EXPIRY` (default **15 minutes**).
- Refresh tokens expire based on `JWT_REFRESH_EXPIRY` (default **7 days**).
- Refresh tokens are stored hashed in the DB with **SHA256**.
- JWTs include a `tokenType` field (`access` | `refresh`) that is checked on verification, preventing a refresh token from being used as an access token and vice versa.
- The secret is read from `JWT_SECRET`; the process fails on startup if it is not defined.

## WebSocket authentication

The realtime connection (`/ws/create`) does not use the HTTP `Authorization` header: the client sends the `accessToken` as the socket's first message (the `Token` handshake). The reason is that the browser's `WebSocket` class does not support custom headers — it exposes no way to set an `Authorization` (or any other) header on the connection request whatsoever, so the token has to be sent in-band as the first message instead. See `docs/WEBSOCKETS.md`.

## Database

The full schema lives in a single file, `database/schema.sql`, which Postgres runs on initialization. The sessions table:

```sql
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_per_user UNIQUE(user_id, refresh_token_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
```

Besides the basic fields, the `users` table includes `account_host` (`'local'` or `'google'`), `avatar_url`, `bio`, `current_game`, statistics (`games_played/won/lost`), and the `xp`/`level` system. See `docs/architecture.md`.

## Dependencies

In `backend/app/package.json`:

- `jsonwebtoken`: ^9.0.3 (types: `@types/jsonwebtoken` ^9.0.10)
- `argon2`: ^0.44.0
- `zod`: ^4.3.6

## Validation

Data is validated with Zod through the middlewares in `src/utils/validation-middelwares.ts` (`validateBody`, `validateParams`, `validateQuery`). Schemas live in `backend/app/src/endpoints-data/`:

- `users-request.ts`: register, login, and Google login schemas
- `game-request.ts`: game endpoint schemas
- `friend-request.ts`, `chat-request.ts`: friend and chat schemas
- `validation-errors.ts`: error messages

## Relevant files

```
backend/app/src/
  utils/
    jwt-utils.ts              - Sign and verify tokens (access/refresh)
    password-utils.ts         - Hash and verify passwords (Argon2)
    validation-middelwares.ts - validateBody / validateParams / validateQuery (Zod)
    error.ts                  - ApiError (errors with statusCode)
  middleware/
    auth-middleware.ts        - Middleware to protect routes
  database/auth/
    router.ts                 - /auth routes
    controller.ts             - register/login/me/refresh/logout handlers
    service.ts                - Authentication logic (incl. loginUserGoogle)
    repository.ts             - DB access (users and sessions)
  database/google/
    router.ts, controller.ts  - /google/login routes and handler (OAuth)
  endpoints-data/
    users-request.ts          - Validation schemas
    users-response.ts         - Response types (AuthUser, FullUser, PublicUser)
    validation-errors.ts      - Error messages

database/
  schema.sql                  - Full schema (users, games, auth_sessions, friends, chats, ...)
```

## Testing

To test the endpoints with curl (against the backend directly on `:3000`, or through nginx at `https://localhost:8443/api`):

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123!"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Get user (full profile)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Logout (requires both access token AND refresh token)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Frontend

The frontend (Next.js) integrates as follows:

1. Calls `/auth/register`, `/auth/login`, or `/google/login`.
2. Stores `accessToken` and `refreshToken` (see `frontend/lib/auth-storage.ts`).
3. Sends `Authorization: Bearer <accessToken>` on protected routes.
4. When the access token expires (`401`), uses `/auth/refresh` to obtain a new one.
5. For realtime, sends the `accessToken` as the WebSocket's first message.

## Environment variables

Backend variables are defined in `backend/container/.env` (see `backend/container/.env.example`):

- `JWT_SECRET` (required)
- `JWT_ACCESS_EXPIRY` (default `15m`)
- `JWT_REFRESH_EXPIRY` (default `7d`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for Google login)

Frontend variables are defined in `frontend/.env` (see `frontend/.env.example`):

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
