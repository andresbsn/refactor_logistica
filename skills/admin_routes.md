# Skill: admin_routes

## Contexto
AdminRoutePages lista rutas generadas y permite inspección/acciones del admin.

## Pasos
1. Usar las reglas definidas en docs/ticket_priorities.md para calcular la prioridad efectiva de un ticket
2. En `AdminRoutePages`:
   - usar `useEffect` para cargar rutas al montar
   - agregar estados: `loading`, `error`, `data`
3. Normalizar respuesta:
   - mapear campos backend -> UI (`route_id`, `crew`, `status`, `started_at`, etc.)
4. Manejar UX:
   - loading skeleton
   - empty state
   - retry button en error
5. Performance:
   - debounce en filtros
   - memorization de tablas/listas   
6. Logs:
   - loggear sólo en dev