# Backend rules (Node/Express)

Estructura sugerida:
- src/
  - routes/
  - controllers/
  - services/
  - repositories/
  - middlewares/
  - validators/
  - utils/
  - config/

Reglas:
- Tablas que se permiten editar: las que comiencen con prefijo log_, ejemplo, log_routes. Las demas las vamos a utilizar de lectura exepto que te indique lo contrario.
- SQL siempre en repositories o services (preferencia: repositories).
- Usar ES Modules (import/export).
- Validación de entrada:
  - Usar schemas (zod/joi/yup). Sin validación manual dispersa.
- Errores:
  - throw new AppError(message, status, code)
  - Middleware de error centralizado.
- Logs:
  - log estructurado (pino/winston) con requestId.
  - NO loggear tokens, passwords, ni datos sensibles.
- Fechas:
  - Guardar en DB como timestamp con zona o UTC (definir estándar).
  - En APIs devolver ISO8601.
- Paginación:
  - Listados grandes siempre paginados (limit/offset o cursor).
- Transacciones:
  - Cuando se crean/actualizan múltiples tablas relacionadas.
- Endpoints:
  - REST consistente:
    - GET /tickets?status=...
    - POST /tickets
    - PUT/PATCH /tickets/:id
- Autenticación:
  - JWT + roles (admin, user, etc.)
  - Middlewares: authRequired, roleRequired.