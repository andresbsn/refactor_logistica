# Arquitectura

Backend (Node/Express):
- Rutas -> Controllers -> Services -> Repositories (DB)
- Controllers:
  - Validan input (schema)
  - Llaman al service
  - Responden HTTP
  - NO SQL, NO lógica de negocio pesada
- Services:
  - Lógica de negocio
  - Transacciones si aplica
  - Reglas de dominio (estados, permisos)
- Repositories:
  - Acceso a DB, queries parametrizadas
  - NO lógica de negocio

Frontend (React):
- Pages (pantallas) orquestan
- Components presentacionales (sin lógica de datos pesada)
- Hooks para data fetching y estado (por feature)
- Servicios API en /services (axios instance)