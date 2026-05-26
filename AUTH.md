# Autenticación - Backend

## Resumen

Se ha implementado un sistema de autenticación JWT en el backend. Los usuarios pueden registrarse, iniciar sesión, y acceder a rutas protegidas. Los tokens de sesión se almacenan en la base de datos con hash SHA256.

## Endpoints

Todos los endpoints están en `/auth`:

### POST /auth/register
Registra un nuevo usuario.

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
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "accessToken": "token",
    "refreshToken": "token"
  }
}
```

### POST /auth/login
Inicia sesión con un usuario existente.

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "accessToken": "token",
    "refreshToken": "token"
  }
}
```

### GET /auth/me
Retorna los datos del usuario autenticado. Requiere header `Authorization: Bearer <accessToken>`.

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

### POST /auth/refresh
Genera un nuevo access token usando el refresh token.

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

### POST /auth/logout
Invalida la sesión actual.

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

El middleware `authMiddleware` protege rutas. Para usarlo:

```typescript
import { authMiddleware } from '@utils/auth-middleware';
import { Router } from 'express';

const router = Router();

router.get('/protected-route', authMiddleware, (req, res) => {
  console.log(req.userId); // userId disponible aquí
});
```

El middleware:
- Valida el header `Authorization: Bearer <token>`
- Verifica la firma del JWT
- Retorna 401 si el token no es válido o no existe
- Agrega `userId` al objeto `req`

## Seguridad

- Las contraseñas se hashean con Argon2
- Los access tokens expiran en 15 minutos
- Los refresh tokens expiran en 7 días
- Los refresh tokens se guardan hasheados en la BD con SHA256

## Base de datos

Se creó la tabla `auth_sessions`:

```sql
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, refresh_token_hash)
);
```

## Dependencias agregadas

- `jsonwebtoken`: 9.1.2
- `argon2`: 0.44.0 (ya estaba)
- `zod`: 4.3.6 (ya estaba)

Están en `backend/app/package.json`.

## Validación

Los datos se validan con Zod. Esquemas en `backend/app/src/endpoints-data/`:

- `users-request.ts`: esquemas para register y login
- `game-request.ts`: esquemas para game endpoints
- `validation-errors.ts`: mensajes de error

## Archivos creados

```
backend/app/src/
  utils/
    jwt-utils.ts          - Generar y verificar tokens
    password-utils.ts     - Hash y verificación de contraseñas
  middleware/
    auth-middleware.ts    - Middleware para proteger rutas
  endpoints-data/
    users-request.ts      - Esquemas de validación
    users-response.ts     - Tipos de respuesta
    validation-errors.ts  - Mensajes de error
    game-request.ts       - Esquemas de game

database/initdb.d/
  auth_sessions.sql       - Tabla de sesiones
```

## Archivos modificados

- `backend/app/src/database/auth/repository.ts`: métodos para BD
- `backend/app/src/database/auth/service.ts`: lógica de autenticación
- `backend/app/src/database/auth/controller.ts`: endpoints
- `backend/app/src/database/auth/router.ts`: rutas
- `backend/app/package.json`: dependencias

No se modificó nada más. El código existente de juego, websockets y frontend está intacto.

## Testing

Para testear los endpoints, usar Postman o curl:

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123!"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Get user
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Frontend

El frontend necesita:

1. Conectarse a los endpoints `/auth/register` y `/auth/login`
2. Guardar el `accessToken` en localStorage
3. Usar el `accessToken` en headers `Authorization: Bearer <token>` para rutas protegidas
4. Cuando el token expire (401), usar el `refreshToken` para pedir un nuevo access token
5. Proteger rutas en Next.js usando el middleware disponible

## Game

Los endpoints de game pueden usar `authMiddleware` para proteger rutas. El `userId` estará disponible en `req.userId`.

Ejemplo:

```typescript
router.post('/game/create', authMiddleware, (req, res) => {
  const userId = req.userId;
  // crear partida con userId
});
```

## Variaciones

Si necesitan:
- Email verification: agregar campo `email_verified` en users
- 2FA: agregar tabla `user_2fa_secrets`
- Password reset: agregar tabla `password_reset_tokens`

Avisad y se agrega.

## Estado

- Endpoints: funcionales
- BD: configurada
- Middleware: listo para usar
- Tests: pasados

Está listo para que frontend integre y game use el middleware.
