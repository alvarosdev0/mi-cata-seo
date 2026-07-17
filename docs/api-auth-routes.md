# BetterAuth API Routes

> Rutas automáticas montadas por `@thallesp/nestjs-better-auth` en `/api/auth/*`
> No requieren controladores — BetterAuth las maneja internamente.

## Auth básico (email/password)

| Método | Ruta                        | Descripción                     |
|--------|-----------------------------|----------------------------------|
| POST   | `/api/auth/sign-up/email`  | Registro con email y contraseña  |
| POST   | `/api/auth/sign-in/email`  | Inicio de sesión                 |
| POST   | `/api/auth/sign-out`       | Cerrar sesión                    |
| GET    | `/api/auth/get-session`    | Obtener sesión actual            |

## Gestión de usuario (built-in)

| Método | Ruta                              | Descripción                     |
|--------|-----------------------------------|----------------------------------|
| POST   | `/api/auth/update-user`          | Actualizar perfil                |
| POST   | `/api/auth/change-password`      | Cambiar contraseña               |
| POST   | `/api/auth/change-email`         | Cambiar email                    |
| POST   | `/api/auth/delete-user`          | Eliminar cuenta                  |
| POST   | `/api/auth/forget-password`      | Solicitar reset de contraseña    |
| POST   | `/api/auth/reset-password`       | Resetear contraseña con token    |
| GET    | `/api/auth/verify-email`         | Verificar email con token        |
| POST   | `/api/auth/send-verification-email` | Reenviar verificación        |

## Admin plugin

| Método | Ruta                                  | Descripción                     |
|--------|---------------------------------------|----------------------------------|
| POST   | `/api/auth/admin/create-user`        | Crear usuario                    |
| GET    | `/api/auth/admin/list-users`         | Listar usuarios (paginación)     |
| GET    | `/api/auth/admin/get-user`           | Obtener usuario por ID           |
| POST   | `/api/auth/admin/set-role`           | Cambiar rol de usuario           |
| POST   | `/api/auth/admin/set-user-password`  | Cambiar contraseña de usuario    |
| POST   | `/api/auth/admin/update-user`        | Actualizar datos de usuario      |
| POST   | `/api/auth/admin/ban-user`           | Banear usuario                   |
| POST   | `/api/auth/admin/unban-user`         | Desbanear usuario                |
| POST   | `/api/auth/admin/list-user-sessions` | Listar sesiones de usuario       |
| POST   | `/api/auth/admin/revoke-user-session` | Revocar una sesión             |
| POST   | `/api/auth/admin/revoke-user-sessions` | Revocar todas las sesiones     |
| POST   | `/api/auth/admin/impersonate-user`   | Impersonar usuario               |
| POST   | `/api/auth/admin/stop-impersonating` | Dejar de impersonar              |
| POST   | `/api/auth/admin/remove-user`        | Eliminar usuario                 |
| POST   | `/api/auth/admin/has-permission`     | Verificar permisos               |

**Total:** ~23 endpoints automáticos.

## Cómo se usan desde NestJS

```typescript
// Desde un controlador o servicio, inyectar AuthService
import { AuthService } from '@thallesp/nestjs-better-auth';

@Injectable()
export class MiServicio {
  constructor(private authService: AuthService) {}

  async ejemplo() {
    const session = await this.authService.api.getSession({
      headers: req.headers,
    });
  }
}
```

## Decoradores disponibles

| Decorador           | Descripción                                   |
|---------------------|-----------------------------------------------|
| `@Session()`        | Obtiene la sesión del request                 |
| `@AllowAnonymous()` | Ruta pública (sin auth)                       |
| `@OptionalAuth()`   | Auth opcional                                 |
| `@Roles(['admin'])` | Requiere rol específico                       |
| `@RequireActiveOrg()` | Requiere organización activa               |
