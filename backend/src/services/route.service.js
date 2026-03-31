const routeRepository = require('../repositories/route.repository');
const ypfService = require('./ypf.service');

const YPF_HISTORY_DOMAIN = process.env.YPF_HISTORY_DOMAIN || 'fleet';
const YPF_HISTORY_SUBDOMAIN = process.env.YPF_HISTORY_SUBDOMAIN || 'ypfruta';

const extractVehiclePlate = (vehicle) => {
    if (!vehicle) return null;

    const candidateFields = [
        'patent',
        'patente',
        'plate',
        'license_plate',
        'dominio',
        'vehicle_plate',
        'alias',
        'label',
        'description',
        'brand',
    ];

    for (const field of candidateFields) {
        const value = vehicle[field];
        if (value) return String(value).trim();
    }

    return null;
};

const extractHistoryItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [
        payload.data,
        payload.history,
        payload.items,
        payload.locations,
        payload.points,
        payload.content,
        payload.records,
        payload.result,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
            const nestedItems = extractHistoryItems(candidate);
            if (nestedItems.length > 0) return nestedItems;
        }
    }

    return [];
};

const extractDevicesItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [
        payload.data,
        payload.devices,
        payload.items,
        payload.content,
        payload.records,
        payload.result,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
            const nestedItems = extractDevicesItems(candidate);
            if (nestedItems.length > 0) return nestedItems;
        }
    }

    return [];
};

const normalizeCoordinates = (item) => {
    const directLatitude = item?.latitude ?? item?.lat ?? item?.y ?? item?.fixLatitude ?? item?.gpsLatitude ?? item?.positionLatitude ?? item?.locationLatitude;
    const directLongitude = item?.longitude ?? item?.lng ?? item?.lon ?? item?.x ?? item?.fixLongitude ?? item?.gpsLongitude ?? item?.positionLongitude ?? item?.locationLongitude;

    if (directLatitude !== undefined && directLongitude !== undefined) {
        return {
            latitude: Number(String(directLatitude).replace(',', '.')),
            longitude: Number(String(directLongitude).replace(',', '.')),
        };
    }

    if (Array.isArray(item?.coordinates) && item.coordinates.length >= 2) {
        return {
            latitude: Number(item.coordinates[0]),
            longitude: Number(item.coordinates[1]),
        };
    }

    const nestedCoordinateSources = [item?.coordinates, item?.location, item?.position, item?.point, item?.geo, item?.gps, item?.coords];

    for (const source of nestedCoordinateSources) {
        if (!source || typeof source !== 'object') {
            continue;
        }

        const latitude = source.latitude ?? source.lat ?? source.y ?? source.fixLatitude ?? source.gpsLatitude;
        const longitude = source.longitude ?? source.lng ?? source.lon ?? source.x ?? source.fixLongitude ?? source.gpsLongitude;

        if (latitude !== undefined && longitude !== undefined) {
            return {
                latitude: Number(String(latitude).replace(',', '.')),
                longitude: Number(String(longitude).replace(',', '.')),
            };
        }
    }

    if (typeof item?.coordinates === 'string') {
        const parts = item.coordinates.split(',').map((part) => part.trim());
        if (parts.length >= 2) {
            const latitude = Number(parts[0]);
            const longitude = Number(parts[1]);
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                return { latitude, longitude };
            }
        }
    }

    return null;
};

const normalizeHistoryTimestamp = (item) => {
    const rawTimestamp = item?.timestamp
        ?? item?.date
        ?? item?.datetime
        ?? item?.created_at
        ?? item?.createdAt
        ?? item?.occurredAt
        ?? item?.eventTime
        ?? item?.time
        ?? item?.generateTime
        ?? item?.messageTime
        ?? item?.gpsTime
        ?? item?.fixTime
        ?? item?.deviceTime
        ?? item?.serverTime;
    if (!rawTimestamp) return null;

    if (rawTimestamp instanceof Date) {
        return Number.isNaN(rawTimestamp.getTime()) ? null : rawTimestamp.toISOString();
    }

    if (typeof rawTimestamp === 'number') {
        const date = new Date(rawTimestamp < 1e12 ? rawTimestamp * 1000 : rawTimestamp);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    if (typeof rawTimestamp === 'string') {
        const trimmed = rawTimestamp.trim();
        return trimmed || null;
    }

    return null;
};

const buildRouteLocationRows = (routeId, historyPayload) => {
    const historyItems = extractHistoryItems(historyPayload);

    const rows = historyItems
        .map((item) => {
            const coordinates = normalizeCoordinates(item);
            const timestamp = normalizeHistoryTimestamp(item);

            if (!coordinates || !timestamp) {
                return null;
            }

            return {
                routeId,
                ticketId: null,
                eventId: 5,
                timestamp,
                longitude: coordinates.longitude,
                latitude: coordinates.latitude,
            };
        })
        .filter(Boolean);

    if (rows.length === 0 && historyItems.length > 0) {
        const sample = historyItems[0] || {};
        console.warn('[route.history] History payload did not match expected shape', {
            routeId,
            sampleKeys: Object.keys(sample),
        });
    }

    return rows;
};

const fetchRouteHistory = async (routeId) => {
    const route = await routeRepository.getRouteHistoryContext(routeId);
    if (!route || !route.started_at || !route.ended_at || !route.vehicle_id) {
        console.warn('[route.history] Missing route context for history fetch', {
            routeId,
            hasRoute: Boolean(route),
            startedAt: route?.started_at || null,
            endedAt: route?.ended_at || null,
            vehicleId: route?.vehicle_id || null,
        });
        return null;
    }

    const vehicle = await routeRepository.getVehicleById(route.vehicle_id);
    const vehiclePlate = extractVehiclePlate(vehicle);

    if (!vehiclePlate) {
        console.warn('[route.history] Missing vehicle plate for YPF history fetch', {
            routeId,
            vehicleId: route.vehicle_id,
            vehicle,
        });
        return null;
    }

    const userId = route.lw_user_id || await ypfService.getSessionUserId();

    if (!userId) {
        console.warn('[route.history] Missing Location World userId for history fetch', {
            routeId,
            vehiclePlate,
        });
        return null;
    }

    console.log('[route.history] Fetching YPF history by plate', {
        routeId,
        vehiclePlate,
        userId,
        from: route.started_at,
        to: route.ended_at,
    });

    try {
        return await ypfService.getHistoryByRoutePlate({
            plate: vehiclePlate,
            domain: YPF_HISTORY_DOMAIN,
            subdomain: YPF_HISTORY_SUBDOMAIN,
            userId,
            startedAt: route.started_at,
            endedAt: route.ended_at,
        });
    } catch (error) {
        console.error('[route.history] Error fetching YPF history by plate:', error.message);
        return null;
    }
};

const storeRouteHistory = async (routeId, historyPayload) => {
    const rows = buildRouteLocationRows(routeId, historyPayload);
    if (rows.length === 0) {
        console.warn('[route.history] No history rows to store', { routeId });
        return [];
    }

    console.log('[route.history] Storing route history rows', { routeId, rows: rows.length });
    return routeRepository.insertRouteLocations(rows);
};

const getAllRoutes = async (filters) => {
    return await routeRepository.findAll(filters);
};

const getRouteById = async (id) => {
    return await routeRepository.findById(id);
};

const createRoute = async (data) => {
    // Aquí se podría agregar validación adicional o lógica de negocio
    return await routeRepository.create(data);
};

const updateRoute = async (id, data) => {
    const updatedRoute = await routeRepository.update(id, data);

    const isRouteClosing = updatedRoute && data && (
        data.ended_at !== undefined ||
        data.endedAt !== undefined ||
        data.is_active === false ||
        data.isActive === false
    );

    if (isRouteClosing) {
        try {
            const history = await fetchRouteHistory(id);
            if (history) {
                updatedRoute.routeHistory = history;
                await storeRouteHistory(id, history);
            }
        } catch (error) {
            console.error('Error fetching route history on close:', error);
        }
    }

    return updatedRoute;
};

// Distance in km using Haversine
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Mapeo de prioridades según skills/ticket_priorities.md
const PRIORITY_MAP = {
    3: { // Tipo Alumbrado
        6: 10,  // Falta de luminaria
        7: 10,  // Semáforo sin funcionar
        15: 4,  // Lámpara apagada
        default: 1
    },
    default: 4
};

const getPriorityValue = (tipo, subtipo, manualPrio) => {
    // 1. Regla específica por subtipo
    const typeMap = PRIORITY_MAP[tipo] || { default: PRIORITY_MAP.default };
    let score = (typeof typeMap === 'number') ? typeMap : (typeMap[subtipo] || typeMap.default);

    // 2. Prioridad manual (si existe y es válida)
    if (manualPrio && typeof manualPrio === 'string' && manualPrio.toLowerCase() !== 'none') {
        const manualMap = {
            'critica': 10, 'critical': 10, 'high': 7, 'alta': 7, 'medium': 4, 'media': 4, 'low': 1, 'baja': 1
        };
        const manualScore = manualMap[manualPrio.toLowerCase()];
        if (manualScore !== undefined) score = manualScore;
    }

    return score;
};

const generateAdminRoutes = async ({
    typeId,
    maxPerRoute = 10,
    radius = 2.0,
    userId,
    proximityWeight = 50,
    priorityWeight = 50,
    minTickets = 1
}) => {
    // 1. Limpiar rutas planeadas anteriores del usuario
    await routeRepository.deletePlannedRoutes(userId);

    const unassignedTickets = await routeRepository.getUnassignedOpenTickets(typeId, 'open', userId);
    if (!unassignedTickets || unassignedTickets.length === 0) return { routesCreated: 0 };

    // Filtramos tickets con coordenadas y les asignamos un valor numérico de prioridad (1-10)
    const pool = unassignedTickets
        .filter(t => t.latitude && t.longitude)
        .map(t => ({
            ...t,
            // Aseguramos que latitude/longitude sean números
            latitude: parseFloat(t.latitude),
            longitude: parseFloat(t.longitude),
            priorityValue: getPriorityValue(t.tipo, t.subtipo, t.prioridad || t.priority)
        }));

    if (pool.length === 0) return { routesCreated: 0 };

    // Semilla de orden: depende de la preferencia del usuario
    if (proximityWeight >= priorityWeight) {
        // Enfoque geográfico: empezamos por ubicación (Norte a Sur) para agrupar por zonas
        pool.sort((a, b) => b.latitude - a.latitude || a.longitude - b.longitude);
    } else {
        // Enfoque prioridad: empezamos por el ticket más urgente
        pool.sort((a, b) => b.priorityValue - a.priorityValue);
    }

    const routesToBatch = [];
    const usedTicketIds = new Set();

    // 3. Algoritmo de ruteo eficiente (Híbrido Dinámico)
    // El radio se expande si la prioridad pesa más, permitiendo agrupar tickets críticos lejos entre sí.
    const effectiveRadius = priorityWeight > 50 
        ? radius * (1 + (priorityWeight - 50) / 10)  // Aumenta progresivamente hasta 6x el radio
        : radius;

    // Si la prioridad es máxima (>95%), eliminamos el límite de radio para agrupar los top priority
    const isGlobalSearch = priorityWeight > 95;

    for (let i = 0; i < pool.length; i++) {
        const seed = pool[i];
        if (usedTicketIds.has(seed.id)) continue;

        usedTicketIds.add(seed.id);
        const currentRouteCluster = [seed];

        // Buscar candidatos en el resto de los tickets no usados
        const candidates = [];
        for (let j = 0; j < pool.length; j++) { // Escaneamos todo el pool para no perder candidatos si el radio es grande
            if (i === j) continue;
            const ticket = pool[j];
            if (usedTicketIds.has(ticket.id)) continue;

            const dist = getDistanceFromLatLonInKm(
                seed.latitude,
                seed.longitude,
                ticket.latitude,
                ticket.longitude
            );

            // Filtrar por radio dinámico (o ignorar si es búsqueda global)
            if (isGlobalSearch || dist <= effectiveRadius) {
                // Normalización agresiva: 
                // En modo proximidad (Weight 100), la distancia manda totalmente.
                // En modo prioridad (Weight 100), la penalización de prioridad manda totalmente.
                const prioPenalization = (10 - ticket.priorityValue);
                
                // Aplicamos un factor de potencia para que los pesos extremos se sientan más
                const pWeight = Math.pow(proximityWeight / 100, 2);
                const rWeight = Math.pow(priorityWeight / 100, 2);
                
                // El score ahora balancea km reales vs "km de penalización de prioridad"
                // Un ticket de prioridad 10 (penalización 0) siempre gana en modo prioridad.
                const score = (pWeight * dist) + (rWeight * prioPenalization * 2); // 1 nivel de prioridad = 2km de desvío aprox en balance 50/50
                
                candidates.push({ ticket, score });
            }
        }

        // Ordenar candidatos por score ascendente (menor es mejor)
        candidates.sort((a, b) => a.score - b.score);

        // Tomar los mejores candidatos para completar la ruta
        const ticketsToAdd = candidates.slice(0, maxPerRoute - 1);
        for (const c of ticketsToAdd) {
            currentRouteCluster.push(c.ticket);
            usedTicketIds.add(c.ticket.id);
        }

        // Guardar grupo si cumple el mínimo
        if (currentRouteCluster.length >= minTickets) {
            routesToBatch.push(currentRouteCluster.map(t => t.id));
        }
    }

    // 4. Inserción Masiva (Batch Create)
    let routesCreated = 0;
    if (routesToBatch.length > 0) {
        routesCreated = await routeRepository.createPlannedRoutesBatch(routesToBatch, userId);
    }

    return { routesCreated };
};


const getAdminRoutes = async (filters) => {
    return await routeRepository.findAll(filters);
};

const confirmRoute = async (id, data) => {
    return await routeRepository.confirmRoute(id, data);
};

const logEvent = async (routeId, ticketId, eventNumber) => {
    return await routeRepository.logEvent(routeId, ticketId, eventNumber);
};

const updateTicketStatus = async (routeId, ticketId, statusData) => {
    return await routeRepository.updateTicketStatus(routeId, ticketId, statusData);
};

const getTicketStatus = async (routeId, ticketId) => {
    return await routeRepository.getTicketStatus(routeId, ticketId);
};

const getVehicles = async () => {
    return await routeRepository.getVehicles();
};

const startRoute = async (routeId, vehicleId) => {
    return await routeRepository.startRoute(routeId, vehicleId);
};

const getRouteHistory = async (routeId) => {
    return await fetchRouteHistory(routeId);
};

const getRouteLocations = async (routeId, eventId = 5) => {
    return await routeRepository.getRouteLocations(routeId, eventId);
};

const getRoutesForLogin = async (userId) => {
    return await routeRepository.findForLogin(userId);
};

module.exports = {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    generateAdminRoutes,
    getAdminRoutes,
    confirmRoute,
    logEvent,
    updateTicketStatus,
    getTicketStatus,
    getVehicles,
    startRoute,
    getRouteHistory,
    getRouteLocations,
    getRoutesForLogin
};
