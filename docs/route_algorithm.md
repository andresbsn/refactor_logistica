# Skill: route_algorithm

## Contexto
Algoritmo de generación automática de rutas en el backend (Node/Express).

## Algoritmo Híbrido: Cercanía + Prioridad

### Parámetros de Entrada
```javascript
{
    typeId: 3,           // Tipo de ticket (ej: Alumbrado)
    maxPerRoute: 10,    // Máx tickets por ruta
    radius: 2.0,        // Radio de cercanía en km
    proximityWeight: 50, // 0-100
    priorityWeight: 50,  // 0-100
    minTickets: 1       // Mín tickets para crear ruta
}
```

### Flujo del Algoritmo

1. **Limpiar rutas planeadas anteriores** - Eliminar rutas con estado 'planned' antes de generar nuevas.

2. **Obtener tickets abiertos no asignados** - Solo tickets con `status = 'open', borrado is not null` y sin asignar a rutas activas.

3. **Asignar valores de prioridad** - Usar `getPriorityValue(tipo, subtipo, prioridadManual)`:
   - Tipo 3 (Alumbrado):
     - Subtipo 6 (Falta luminaria): 10
     - Subtipo 7 (Semáforo sin funcionar): 10
     - Subtipo 15 (Lámpara apagada): 4
     - Otros: 1
   - Default: 4

4. **Loop de clustering**:
   - **Semilla**: Ticket con mayor prioridad disponible
   - **Candidatos**: Tickets dentro del radio definido
   - **Score híbrido**: `(proximityWeight * distancia) + (priorityWeight * penalizacion * factorEscala)`
     - penalizacion = (10 - priorityValue) → Crítica=0, Baja=9
     - factorEscala = 0.5 (ajustable)
   - **Selección**: Elegir candidato con menor score
   - **Repetir** hasta maxPerRoute o sin candidatos

5. **Guardar ruta** - Si cumple minTickets, crear ruta en DB con tickets asociados.

### Implementación en Backend

**Archivo**: `backend/src/services/route.service.js`

```javascript
// Función de distancia Haversine
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) { ... }

// Mapeo de prioridades (importar de skills/ticket_priorities.md)
const PRIORITY_MAP = { ... };

function getPriorityValue(tipo, subtipo, manualPrio) { ... }

async function generateAdminRoutes(params) { ... }
```

### Errores Comunes a Evitar

- No filtrar tickets sin coordenadas (lat/lng)
- No manejar el caso de sin tickets disponibles
- No limpiar rutas anteriores antes de generar nuevas
- Usar radio en metros en lugar de km
- Olvidar actualizar estado de tickets en `log_route_ticket`

### Testing

- Probar con radio pequeño (0.5km) → muchas rutas cortas
- Probar con radio grande (10km) → pocas rutas largas
- Verificar que tickets críticos (prioridad 10) se prioricen aunque estén más lejos
- Verificar que sin weighting de prioridad, se agrupe solo por cercanía
