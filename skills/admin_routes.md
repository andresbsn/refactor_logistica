# Skill: admin_routes

## Contexto
`AdminRoutesPage` muestra las rutas planificadas del administrador, dispara la generación automática y permite confirmarlas/asignarlas.

## Dependencias
- `skills/ticket_priorities.md`
- `skills/route_algorithm.md`
- `skills/modern_design_system.md`

## Pasos
1. Cargar rutas con `useEffect` al montar usando `routeService.getAdminRoutes({ planed: true })`.
2. Cargar tickets abiertos y cuadrillas, luego normalizar la respuesta para el UI.
3. Mantener estados explícitos: `loading`, `error`, `isGenerating`, `routes`, `crews`, `allOpenTickets`.
4. Calcular derivados con `useMemo`:
   - tickets asignados
   - tickets disponibles
5. Generar rutas con `routeService.generateRoutes(params)` apuntando a `POST /routes/admin/generate`.
6. Aplicar debounce en la auto-generación cuando cambian pesos/configuración.
7. Manejar UX:
   - loading skeleton
   - empty state
   - retry / toast de error
8. Confirmar rutas con `routeService.confirm(id, data)` y refrescar listas.
9. Respetar el sistema visual premium del proyecto:
   - glassmorphism
   - badges con estados claros
   - CTAs destacados
10. Loggear solo en desarrollo y evitar ruido en producción.
