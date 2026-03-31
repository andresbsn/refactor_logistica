# Skill: ticket_priorities

## Definición de Niveles de Prioridad
Usaremos una escala numérica del 1 al 10 para el algoritmo (10 = máxima urgencia).

| Nivel | Valor | Descripción |
| :--- | :--- | :--- |
| **Crítica** | 10 | Peligro inminente o corte total de servicio |
| **Alta** | 7 | Falla importante, requiere atención en el día |
| **Media** | 4 | Tarea programable, sin urgencia inmediata |
| **Baja** | 1 | Mantenimiento preventivo o mejoras |

## Reglas por Subtipo
Aquí definiremos qué subtipos disparan cada prioridad:

### Tipo 3 (Alumbrado)
- **Subtipo 6 (Falta de luminaria):** Prioridad Crítica (10)
- **Subtipo 7 (Semáforo sin funcionar):** Prioridad Crítica (10)
- **Subtipo 15 (Lámpara apagada):** Prioridad Media (4)
- **Otros Subtipos (Tipo 3):** Prioridad Baja (1) como base.

### Otros Tipos
- **Default General:** Si el tipo/subtipo no está mapeado, asignar Prioridad Media (4).

## Especificaciones Técnicas para el Agente
Para la implementación en `route.service.js` o `ticket.repository.js`:

1.  **Mapeo de DB**: Las reglas se aplican sobre las columnas `t.tipo` (ID) y `t.subtipo` (ID).
2.  **Precedencia**: 
    - 1°: Regla específica por Subtipo mapeado.
    - 2°: Prioridad manual definida en el campo `t.prioridad` (si existe y es válida).
    - 3°: Prioridad por defecto del Tipo.
    - 4°: Prioridad Media (4).
3.  **Cálculo de Score**: 
    - `PriorityValue` = Valor definido en este skill (1-10).
    - El algoritmo debe normalizar este valor para que sea comparable con la distancia (km).

## Aplicación en Algoritmo
Al generar rutas, el sistema usa un balance dinámico entre Proximidad y Prioridad:

1.  **Prioridad Alta (>50%)**: El radio de búsqueda se expande automáticamente (hasta 6 veces el radio base). Si se selecciona 100% de prioridad, se ignoran las distancias para agrupar únicamente los tickets más urgentes del sistema.
2.  **Proximidad Alta (>50%)**: El sistema favorece la cercanía geográfica estricta. Con 100% de proximidad, se agrupan los tickets más cercanos al punto de inicio sin importar su nivel de prioridad.
3.  **Cálculo de Score**: Se utiliza una normalización cuadrática de los pesos para asegurar que las selecciones extremas (0% o 100%) tengan un efecto radical en la formación de las rutas.
    - `Score = (proximityWeight² * distancia) + (priorityWeight² * penalizaciónPriority * 2)`
    - Donde `penalizaciónPriority = 10 - PriorityValue`. 
    - Un `Score` menor indica un mejor candidato para la ruta actual.
