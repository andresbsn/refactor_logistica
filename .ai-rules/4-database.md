# Database rules (PostgreSQL)

Convenciones:
- Schema: public o schema dedicado (ej: panel147).
- Tablas: snake_case plural (tickets, routes, crews).
- PK: id (uuid o serial, definir por proyecto).
- FK: <tabla>_id (crew_id, route_id).

Reglas:
- Foreign keys siempre con índices en columnas FK.
- Constraints > validación en app cuando corresponda:
  - NOT NULL
  - UNIQUE
  - CHECK (status in (...))
- Auditoría/Historial:
  - Tablas de eventos (ticket_events, route_events) para trazabilidad.
- Fechas:
  - created_at, updated_at (DEFAULT now()).
  - Si hay soft delete: deleted_at.
- Migraciones:
  - Siempre con migraciones versionadas (nunca cambios manuales sin script).
- Query performance:
  - EXPLAIN ANALYZE antes de optimizar “a ciegas”.
  - Índices compuestos según filtros reales.