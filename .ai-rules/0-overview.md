# Proyecto: Panel 147 — Reglas globales

Objetivo:
- Convertir el proyecto  que esta en next, en un proyecto con frontend en reactjs con tailwind en su version 4 y backend en nodejs y javascript usando postgres como base de datos.
- Sistema municipal para gestión de tickets, rutas y cuadrillas.
- Prioridad: confiabilidad, trazabilidad, performance y UX clara.

Principios:
- Cambios pequeños, testeables, con logs y manejo de errores consistente.
- No romper compatibilidad de APIs sin versionado/migración.
- Observabilidad primero: logs útiles > logs ruidosos.

Convenciones:
- Idioma: código en inglés (variables/funciones), UI puede ser ES.
- Fechas y horas: todo en UTC en backend y DB; convertir a America/Argentina/Cordoba en frontend.
- Nombres: snake_case en DB, camelCase en JS/TS.