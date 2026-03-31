# Frontend rules (React)

Reglas:
- Evitar lógica en componentes grandes: extraer hooks y helpers.
- Llamadas a API:
  - Siempre vía services/api.js (axios instance).
  - Manejo de errores uniforme (toast + logger).
- Estado:
  - Por feature (ej: tickets, rutas, cuadrillas).
  - Evitar prop drilling profundo (context o store si aplica).
- UI:
  - Prioridad a legibilidad: tablas claras, filtros visibles.
  - Loading/empty/error states SIEMPRE.
- Timezone:
  - Mostrar en America/Argentina/Cordoba.
  - Convertir desde ISO del backend.
- Seguridad:
  - No guardar tokens en lugares inseguros si no hace falta.
  - Preferir httpOnly cookie si el backend lo soporta (si no, minimizar exposición).