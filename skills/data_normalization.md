# Skill: data_normalization

## Contexto
Normalizar respuestas del backend para que coincidan con lo que esperan los componentes UI.

## Problema

El backend devuelve campos en snake_case (DB), pero los componentes UI esperan camelCase.

## Normalización de Tickets

```javascript
const normalizeTicket = (t) => ({
    ...t,
    ticketNumber: t.nro_ticket || `#${t.id}`,
    title: t.asunto || "Sin asunto",
    address: t.dire_completa || (t.calle ? `${t.calle} ${t.n_calle || ''}`.trim() : t.direccion) || "Sin dirección",
    category: t.tipo_nombre || t.tipo || "General",
    priority: (t.prioridad || t.priority || "low").toLowerCase(),
    tipo: t.tipo_nombre || t.tipo,
    subtipo: t.subtipo_nombre || t.subtipo,
    // Coordenadas
    lat: t.latitude,
    lng: t.longitude,
    latitude: t.latitude,
    longitude: t.longitude,
});
```

## Normalización de Rutas

```javascript
const normalizeRoute = (r) => ({
    id: r.id,
    name: `Ruta ${r.id}`,
    status: r.is_active ? "planned" : "completed",
    tickets: (r.tickets || []).map(normalizeTicket),
    crew: r.crew_id ? "Asignada" : null,
});
```

## Normalización de Crews

```javascript
const normalizeCrew = (c) => ({
    id: c.unica,
    name: c.usuario || `Agente ${c.unica}`,
    id_agente: c.unica
});
```

## Dónde Aplicar

1. **En el componente** antes de usar los datos (AdminRoutesPage.jsx)
2. **O en un hook** dedicado si se reutiliza en múltiples lugares

## Campos Típicos a Normalizar

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| nro_ticket | ticketNumber |
| dire_completa | address |
| tipo_nombre | tipo / category |
| subtipo_nombre | subtipo |
| latitude | lat / latitude |
| longitude | lng / longitude |
| prioridad | priority |
| is_active | status |
| crew_id | crew |
| created_at | createdAt |
| updated_at | updatedAt |

## Regla General

Si el componente espera un campo y no existe, fallback al campo original o a un string vacío.
