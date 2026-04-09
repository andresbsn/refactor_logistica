# Skill: route_algorithm

## Contexto
Algoritmo de generación automática de rutas en el backend (`routeService.generateAdminRoutes`).

## Parámetros de Entrada
```javascript
{
  typeId: 3,
  maxPerRoute: 10,
  radius: 2.0,
  proximityWeight: 50,
  priorityWeight: 50,
  minTickets: 1
}
```

## Flujo del Algoritmo
1. Limpiar rutas planeadas anteriores (`planed = true`) y sus asociaciones.
2. Obtener tickets abiertos, con coordenadas y sin ruta activa.
3. Calcular prioridad usando `skills/ticket_priorities.md`.
4. Convertir el radio efectivo a metros.
5. Elegir una semilla y buscar candidatos dentro del radio.
6. Calcular score híbrido:
   - `distanceScore = 1 - (dist / effectiveRadius)`
   - `priorityScore = priorityValue / 10`
   - `score = (proximityWeight * distanceScore) + (priorityWeight * priorityScore)`
7. Ordenar candidatos por score descendente y tomar los mejores.
8. Guardar la ruta solo si cumple el mínimo de tickets.

## Implementación en Backend
- `backend/src/services/route.service.js`
- `backend/src/controllers/route.controller.js`
- `backend/src/routes/route.routes.js`

## Errores Comunes a Evitar
- No filtrar tickets sin coordenadas.
- Olvidar convertir kilómetros a metros.
- No limpiar rutas `planed` anteriores.
- Dejar tickets críticos fuera del score de prioridad.
- No respetar el mínimo de tickets antes de persistir.

## Testing
- Radio pequeño (`0.5`) produce rutas más cortas.
- Radio grande (`10`) produce menos rutas y clusters más amplios.
- Tickets críticos deben ganar frente a tickets base.
- Verificar `POST /routes/admin/generate` con distintos pesos.
