# Admin Routes

## Objetivo
Documentar el flujo de planificación de rutas para administrador, desde la UI hasta el backend.

## Flujo
1. `AdminRoutesPage` carga rutas, tickets abiertos y cuadrillas.
2. El usuario ajusta pesos, radio y mínimos.
3. La UI llama `POST /routes/admin/generate`.
4. El backend genera rutas con `routeService.generateAdminRoutes`.
5. La vista refresca rutas y permite confirmación/asignación.

## Archivos Clave
- `frontend/src/pages/AdminRoutesPage.jsx`
- `frontend/src/services/api.js`
- `backend/src/controllers/route.controller.js`
- `backend/src/services/route.service.js`
- `backend/src/routes/route.routes.js`

## Skills Relacionados
- `skills/admin_routes.md`
- `skills/ticket_priorities.md`
- `skills/route_algorithm.md`
- `skills/modern_design_system.md`

## Reglas de UI
- Mostrar `loading`, `empty` y `error`.
- Normalizar la respuesta del backend antes de renderizar.
- Mantener estados de configuración y generación separados.

## Reglas de Backend
- Filtrar tickets abiertos con coordenadas.
- Respetar la prioridad efectiva del planner.
- No persistir rutas debajo del mínimo de tickets.
