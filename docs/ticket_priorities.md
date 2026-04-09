# Skill: ticket_priorities

## Definición de Niveles de Prioridad
Escala numérica del 1 al 10 para el algoritmo.

| Nivel | Valor | Descripción |
| :--- | :--- | :--- |
| Crítica | 10 | Peligro inminente o corte total de servicio |
| Alta | 7 | Falla importante, requiere atención en el día |
| Media | 4 | Tarea programable, sin urgencia inmediata |
| Baja | 1 | Mantenimiento preventivo o mejoras |

## Reglas por Subtipo
### Tipo 3 (Alumbrado)
- Subtipo 6 (Falta de luminaria): `10`
- Subtipo 7 (Semáforo sin funcionar): `10`
- Subtipo 15 (Lámpara apagada): `4` en el mapeo, pero el generador actual la degrada a `1` para el clustering.
- Otros subtipos: `1`

### Otros Tipos
- No mapeados: `1` en la lógica de ruteo actual.

## Especificaciones Técnicas
1. El mapeo se aplica sobre `t.tipo` y `t.subtipo`.
2. La prioridad efectiva del planner solo conserva valores `>= 7`.
3. Prioridades menores a `7` quedan como base para no forzar rutas lejanas.

## Aplicación en Algoritmo
- `priorityValue` se normaliza para convivir con la distancia en el score híbrido.
- Un `score` mayor favorece más al candidato dentro de la ruta.
