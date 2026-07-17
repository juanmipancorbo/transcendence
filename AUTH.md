# Autenticación - Backend

## Resumen

El backend implementa autenticación JWT. Los usuarios pueden registrarse con email/contraseña o mediante Google OAuth, iniciar sesión y acceder a rutas protegidas. Las contraseñas se hashean con Argon2. Los refresh tokens de sesión se almacenan en la base de datos hasheados con SHA256.

## Endpoints

Endpoints de email/contraseña bajo `/auth`; el login con Google bajo `/google`.

> A través del gateway nginx la API cuelga de `/api` (p. ej. `POST /api/auth/login`). El prefijo `/api` se elimina antes de llegar al backend.

### POST /auth/register
Registra un nuevo usuario y devuelve tokens (hace login automáticamente).

Reglas de validación (Zod, `users-request.ts`):
- `email`: email válido
- `username`: 3–16 caracteres
- `password`: 8–16 caracteres, con al menos una minúscula, una mayúscula, un dígito y un símbolo

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

Si el email o el username ya existen, responde `409` con `{ "success": false, "error": "Email or username is already taken" }`.

### POST /auth/login
Inicia sesión con un usuario existente.

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response (200): misma forma que `register` (objeto `data` con `user`, `accessToken` y `refreshToken`).

Credenciales inválidas → `401` con `{ "success": false, "error": "Invalid credentials" }`.

### POST /google/login
Login/registro mediante Google OAuth. El frontend obtiene un `code` de Google y lo envía aquí; el backend lo intercambia por el perfil del usuario, crea la cuenta si no existe (`account_host = 'google'`) y devuelve tokens.

Request:
```json
{
  "code": "google_authorization_code"
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

Requiere `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` en el entorno.

### GET /auth/me
Retorna el perfil completo del usuario autenticado. Requiere header `Authorization: Bearer <accessToken>`.

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
Genera un nuevo access token usando el refresh token. No requiere header de autorización; el refresh token va en el body.

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

El refresh token debe existir (hasheado) en la BD; si no, responde `401`.

### POST /auth/logout
Invalida la sesión actual. **Requiere** header `Authorization: Bearer <accessToken>` **y** el `refreshToken` en el body (se elimina de la BD la sesión correspondiente).

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

El middleware `authMiddleware` (`src/middleware/auth-middleware.ts`) protege rutas. Para usarlo:

```typescript
import { authMiddleware } from "../../middleware/auth-middleware";
import { Router } from "express";

const router = Router();

router.get("/protected-route", authMiddleware, (req, res) => {
  console.log(req.userId); // userId disponible aquí
  console.log(req.user);   // payload del token: { id, email, username }
});
```

El middleware:
- Valida el header `Authorization: Bearer <token>`
- Verifica la firma del JWT y que sea un token de tipo `access`
- Retorna `401` si el token no es válido o no existe
- Agrega `userId` (string) y `user` (payload del token) al objeto `req`

## Seguridad

- Las contraseñas se hashean con **Argon2** (`argon2`).
- Los access tokens expiran según `JWT_ACCESS_EXPIRY` (por defecto **15 minutos**).
- Los refresh tokens expiran según `JWT_REFRESH_EXPIRY` (por defecto **7 días**).
- Los refresh tokens se guardan hasheados en la BD con **SHA256**.
- Los JWT incluyen un campo `tokenType` (`access` | `refresh`) que se comprueba al verificar, evitando usar un refresh token como access token y viceversa.
- El secreto se toma de `JWT_SECRET`; el proceso falla al arrancar si no está definido.

## Autenticación por WebSocket

La conexión realtime (`/ws/create`) no usa el header HTTP: el cliente envía el `accessToken` como primer mensaje del socket (handshake `Token`). Ver `docs/WEBSOCKETS.md`.

## Base de datos

El esquema completo vive en un único archivo, `database/schema.sql`, que Postgres ejecuta al inicializarse. La tabla de sesiones:

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

La tabla `users` incluye, además de los campos básicos, `account_host` (`'local'` o `'google'`), `avatar_url`, `bio`, `current_game`, estadísticas (`games_played/won/lost`) y el sistema de `xp`/`level`. Ver `docs/architecture.md`.

## Dependencias

En `backend/app/package.json`:

- `jsonwebtoken`: ^9.0.3 (tipos: `@types/jsonwebtoken` ^9.0.10)
- `argon2`: ^0.44.0
- `zod`: ^4.3.6

## Validación

Los datos se validan con Zod mediante los middlewares de `src/utils/validation-middelwares.ts` (`validateBody`, `validateParams`, `validateQuery`). Esquemas en `backend/app/src/endpoints-data/`:

- `users-request.ts`: esquemas de register, login y Google login
- `game-request.ts`: esquemas de endpoints de juego
- `friend-request.ts`, `chat-request.ts`: esquemas de amigos y chat
- `validation-errors.ts`: mensajes de error

## Archivos relevantes

```
backend/app/src/
  utils/
    jwt-utils.ts              - Firmar y verificar tokens (access/refresh)
    password-utils.ts         - Hash y verificación de contraseñas (Argon2)
    validation-middelwares.ts - validateBody / validateParams / validateQuery (Zod)
    error.ts                  - ApiError (errores con statusCode)
  middleware/
    auth-middleware.ts        - Middleware para proteger rutas
  database/auth/
    router.ts                 - Rutas de /auth
    controller.ts             - Handlers de register/login/me/refresh/logout
    service.ts                - Lógica de autenticación (incl. loginUserGoogle)
    repository.ts             - Acceso a BD (usuarios y sesiones)
  database/google/
    router.ts, controller.ts  - Rutas y handler de /google/login (OAuth)
  endpoints-data/
    users-request.ts          - Esquemas de validación
    users-response.ts         - Tipos de respuesta (AuthUser, FullUser, PublicUser)
    validation-errors.ts      - Mensajes de error

database/
  schema.sql                  - Esquema completo (users, games, auth_sessions, friends, chats, ...)
```

## Testing

Para probar los endpoints con curl (contra el backend directo en `:3000`, o a través de nginx en `https://localhost:8443/api`):

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123!"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Get user (perfil completo)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Logout (requiere access token Y refresh token)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Frontend

El frontend (Next.js) se integra así:

1. Se conecta a `/auth/register`, `/auth/login` o `/google/login`.
2. Guarda `accessToken` y `refreshToken` (ver `frontend/lib/auth-storage.ts`).
3. Envía `Authorization: Bearer <accessToken>` en las rutas protegidas.
4. Cuando el access token expira (`401`), usa `/auth/refresh` para obtener uno nuevo.
5. Para el realtime, envía el `accessToken` como primer mensaje del WebSocket.

## Variables de entorno

Definidas en `backend/container/.env` (ver `.env.example`):

- `JWT_SECRET` (obligatorio)
- `JWT_ACCESS_EXPIRY` (por defecto `15m`)
- `JWT_REFRESH_EXPIRY` (por defecto `7d`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (para el login con Google)
