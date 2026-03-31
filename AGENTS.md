# AGENTS.md - Logistica Inteligente Refactor

## Project Overview
- **Type**: Full-stack webapp (municipal ticket/crew/route management system)
- **Frontend**: Next.js 16 with React 19, TailwindCSS 4, TypeScript
- **Backend**: Node.js/Express with PostgreSQL
- **Legacy Frontend**: React + Vite (being migrated)

## Build/Lint/Test Commands

### Root (Next.js app)
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

### Backend (Express API)
```bash
cd backend
npm run dev      # Start with nodemon (auto-reload)
npm run start    # Start production server (node src/index.js)
# No tests configured
```

### Frontend (Vite - legacy, being migrated)
```bash
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Code Style Guidelines

### General Conventions
- **Language**: Code in English (variables, functions, comments), UI text in Spanish
- **Dates**: Store in UTC in backend/DB; display in `America/Argentina/Cordoba` timezone on frontend
- **Naming**: `snake_case` in DB tables/columns, `camelCase` in JS/TS
- **Modules**: Use ES Modules (`import`/`export`), not CommonJS

### Architecture

#### Backend (Node/Express)
```
src/
  routes/      # Express routers, define endpoints
  controllers/ # Validate input, call services, return HTTP responses
  services/    # Business logic, transactions
  repositories/# DB access, parameterized queries only
  middlewares/ # Auth, validation, error handling
  validators/  # Zod/Joi schemas
  utils/       # Helpers
  config/      # Environment config
```

#### Frontend (React/Next.js)
- **Pages**: Screen orchestration
- **Components**: Presentational (minimal data logic)
- **Hooks**: Data fetching and state per feature
- **Services**: API calls via axios instance in `/services`

### Imports & Organization
- Group imports: external libs -> internal modules -> local components
- Use path aliases (`@/*`) configured in tsconfig.json
- Avoid barrel exports in performance-critical paths

### TypeScript
- Enable `strict: true` in tsconfig.json
- Prefer explicit types over `any`
- Use interfaces for object shapes, types for unions/primitives

### Error Handling
- Backend: Throw `AppError(message, statusCode, code)` with centralized error middleware
- Frontend: Use toast notifications + structured logging
- Never expose stack traces in production

### Database
- Tables: `snake_case` plural (tickets, routes, crews)
- PK: `id` (uuid or serial)
- FK: `<table>_id` (crew_id, route_id)
- Always use parameterized queries (no string concatenation)
- Add indexes on FK columns and filtered fields
- Include `created_at`, `updated_at` timestamps
- Use CHECK constraints for status validation

### API Design
- RESTful endpoints: `GET /tickets?status=open`, `POST /tickets`, `PUT /tickets/:id`
- Return ISO8601 dates
- Paginate large lists (limit/offset or cursor)

### Security
- Hash passwords with bcrypt
- JWT with short expiry + refresh tokens
- CORS: allow only necessary origins
- Rate limit login and sensitive endpoints
- NEVER commit `.env` files with real credentials

### UI/UX
- Always show loading, empty, and error states
- Prioritize readable tables with visible filters
- Use Radix UI primitives for accessible components

### Logging
- Use structured logging with requestId
- NEVER log tokens, passwords, or sensitive data
- Log levels: error (failures), info (key actions), debug (dev only)

## Triggers (Frontend)

### AdminRoutesPage
**Cuando** el agente visite, edite o trabaje sobre:
- `frontend/src/pages/AdminRoutesPage.jsx`

**Entonces** debe ejecutar los skills:
- `skills/admin_routes.md`
- `skills/ticket_priorities.md`
- `skills/route_algorithm.md`
- `skills/modern_design_system.md`

### CrewTicketResolution
**Cuando** el agente visite, edite o trabaje sobre:
- `frontend/src/components/crew/ticket-resolve-dialog.jsx`

**Entonces** debe ejecutar los skills:
- `skills/crew_ticket_resolution.md`

**Objetivo de los skills**
- Asegurar que el flujo de resolución de tickets por parte de la cuadrilla siga la lógica de negocio: registro de eventos (Antes/Después) y actualización de estados en `log_route_location` y `log_route_ticket`.
- Mantener la integridad de los datos de seguimiento de ruta en tiempo real.

### API Services y Context
**Cuando** el agente trabaje con:
- Llamadas HTTP o servicios API
- Contextos de React (Auth, Routes)

**Entonces** debe ejecutar los skills:
- `skills/api_services/SKILL.md`
- `skills/context_patterns.md`
- `skills/data_normalization.md`
