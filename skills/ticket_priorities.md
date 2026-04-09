# Skill: ticket_priorities

## Contexto
Reglas de prioridad usadas por el generador de rutas del administrador.

## Escala
- `10` = crítica
- `7` = alta
- `4` = media
- `1` = baja o base

## Reglas Actuales del Backend
1. Tipo 3 (Alumbrado):
   - Subtipo 6 (Falta de luminaria): `10`
   - Subtipo 7 (Semáforo sin funcionar): `10`
   - Subtipo 15 (Lámpara apagada): `4` en el mapeo, pero el generador la degrada a `1` para el clustering.
   - Otros subtipos: `1`
2. Cualquier tipo/subtipo no mapeado termina usando `1` en la lógica de ruteo actual.

## Regla Clave
- El planner solo deja pasar prioridad alta real cuando el valor es `>= 7`.
- Valores `4` o menores se consideran prioridad base para no forzar rutas lejanas.

## Uso
- Consultar este skill antes de ajustar el score de generación o normalizar prioridades en el frontend.
