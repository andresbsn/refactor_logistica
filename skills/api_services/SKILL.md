# Skill: api_services

## Contexto
Patrones para servicios API en el frontend (React + Vite).

## Estructura de Servicios

**Ubicación**: `frontend/src/services/api.js`

### Axios Instance

```javascript
const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: { 'Content-Type': 'application/json' },
});
```

### Interceptors

**Request**: Agregar token JWT desde localStorage:
```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

**Response**: Manejo de errores genérico:
```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Error de conexión';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);
```

### Ejemplos
    - Para ver los servicios existentes ir al archivo `reference/example.js`

## Agregar Nuevo Servicio

1. **Definir endpoint** en `api.js` siguiendo el patrón:
   ```javascript
   export const serviceName = {
       method: (params) => api.method('/endpoint', { params }).then(res => res.data),
   };
   ```

2. **Manejar errores** en el componente/hook que usa el servicio (no en el servicio mismo).

3. **Normalizar respuesta** si los campos no coinciden con el UI (ver skill `data_normalization`).

## Endpoints del Backend

- `GET /tickets` - Listar tickets (soporta query params: status, limit)
- `GET /tickets/:id` - Ticket por ID
- `POST /tickets/:id/cambiarEstado` - Cambiar estado de ticket
- `GET /routes` - Listar rutas
- `GET /routes/admin` - Rutas para admin
- `POST /routes/admin/generate` - Generar rutas automáticas
- `PATCH /routes/admin/:id/confirm` - Confirmar y asignar ruta a cuadrilla
- `GET /users/crew-leaders` - Obtener líderes de cuadrilla
- `POST /auth/login` - Iniciar sesión

## Reglas Obligatorias

**NUNCA** hacer fetch directo en componentes. Siempre:
1. Agregar el endpoint en `api.js` como servicio
2. Importar y usar el servicio desde el componente/hook

Ejemplo correcto:
```javascript
// api.js
export const ticketService = {
    changeStatus: (id, estado) => api.post(`/tickets/${id}/cambiarEstado`, { estado }).then(res => res.data),
};

// Componente
import { ticketService } from "../../services/api"
await ticketService.changeStatus(ticket.id, "solved")
```

Ejemplo incorrecto (PROHIBIDO):
```javascript
// NO USAR fetch directo
await fetch(url, { headers: ..., body: ... })
```

## Notas

- El baseURL está hardcodeado a localhost:4000 en desarrollo
- Usar `.then(res => res.data)` para obtener solo el body
- Para endpoints que devuelven estructura `{ data: ... }`, mantener el `.then(res => res.data)` completo
