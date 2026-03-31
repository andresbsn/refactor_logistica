# Proyecto de Logística Inteligente - Refactorización

## Estado Actual
Hemos dividido el proyecto en dos partes principales: `frontend` (React + Vite) y `backend` (Node.js + Express).

### Backend (`/backend`)
- **Estructura Profesional**: Organizado en `controllers`, `services`, `routes`, `models` y `middleware`.
- **Rutas API**: Se implementaron rutas base para `tickets` y un sistema de manejo de errores global.
- **Configuración**: Uso de `dotenv` para variables de entorno.
- **Scripts**: 
  - `npm run dev`: Inicia el servidor con `nodemon`.
  - `npm start`: Inicia el servidor normalmente.

### Frontend (`/frontend`)
- **Tecnología**: React con Vite.
- **Estilos**: Tailwind CSS 4 con `@tailwindcss/vite`.
- **Navegación**: `react-router-dom` (reemplazando Next.js Routing).
- **Componentes**: Todos los componentes originales de v0 (`shadcn/ui`, `lucide`, `recharts`) han sido migrados.
- **Lógica**: Se mantuvieron y adaptaron los contextos de `Auth` y `Routes` para funcionar en una SPA tradicional.

## Próximos Pasos
1. **Conexión a Base de Datos**: Una vez que proporciones los datos de acceso y las tablas, configuraremos el pool de conexiones en `backend/src/config/db.js`.
2. **Modelos y Servicios**: Crearemos los modelos correspondientes y los servicios que interactúen con las tablas reales.
3. **Integración Frontend-Backend**: Sustituiremos el mock data del frontend por llamadas reales a la API mediante `axios`.

---
**Nota**: Los archivos han sido convertidos a `.js`/`.jsx`. Algunos componentes en `frontend/src/components/ui` pueden contener sintaxis de tipos de TypeScript residual que podrías querer limpiar, aunque Vite suele manejarlos bien durante el desarrollo.
