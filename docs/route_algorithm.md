# Skill: route_algorithm

## Contexto
Algoritmo de generación automática de rutas para administrador en `routeService.generateAdminRoutes`.

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
2. Obtener tickets abiertos, sin borrado, con coordenadas y sin ruta activa.
3. Calcular `priorityValue` usando `skills/ticket_priorities.md`.
4. Convertir el radio a metros.
5. Elegir una semilla y buscar candidatos dentro del radio.
6. Calcular el score:
   - `distanceScore = 1 - (dist / effectiveRadius)`
   - `priorityScore = priorityValue / 10`
   - `score = (proximityWeight * distanceScore) + (priorityWeight * priorityScore)`
7. Ordenar candidatos por score descendente y tomar los mejores.
8. Persistir la ruta solo si cumple `minTickets`.

## Implementación en Backend
- `backend/src/services/route.service.js`
- `backend/src/controllers/route.controller.js`
- `backend/src/routes/route.routes.js`

## Errores Comunes a Evitar
- No filtrar tickets sin coordenadas.
- No convertir kilómetros a metros.
- No limpiar rutas `planed` anteriores.
- Olvidar respetar el mínimo de tickets antes de insertar.

## Testing
- `radius = 0.5` genera rutas más compactas.
- `radius = 10` genera rutas más amplias.
- Tickets críticos deben dominar frente a tickets base.
- Validar `POST /routes/admin/generate` con distintos pesos.
