const routeRepository = require('../repositories/route.repository');
const ypfService = require('./ypf.service');

const YPF_HISTORY_DOMAIN = process.env.YPF_HISTORY_DOMAIN || 'fleet';
const YPF_HISTORY_SUBDOMAIN = process.env.YPF_HISTORY_SUBDOMAIN || 'ypfruta';
const MAX_ROUTE_HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;

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

const getRouteHistoryWindowMs = (startedAt, endedAt) => {
    const startDate = new Date(startedAt);
    const endDate = new Date(endedAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return null;
    }

    return endDate.getTime() - startDate.getTime();
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

const fetchRouteHistory = async (routeId, routeContext = null) => {
    const route = routeContext || await routeRepository.getRouteHistoryContext(routeId);
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

    const historyWindowMs = getRouteHistoryWindowMs(route.started_at, route.ended_at);
    if (historyWindowMs === null) {
        console.warn('[route.history] Invalid route timestamps for YPF history fetch', {
            routeId,
            startedAt: route.started_at || null,
            endedAt: route.ended_at || null,
        });
        return null;
    }

    if (historyWindowMs < 0 || historyWindowMs > MAX_ROUTE_HISTORY_WINDOW_MS) {
        console.warn('[route.history] Skipping YPF history fetch because the route window exceeds 24 hours', {
            routeId,
            startedAt: route.started_at || null,
            endedAt: route.ended_at || null,
            windowHours: historyWindowMs / (60 * 60 * 1000),
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

const closeRouteUnexpectedly = async (routeId, userId, observations) => {
    const route = await routeRepository.getRouteHistoryContext(routeId);

    if (!route || route.deleted_at) {
        return null;
    }

    const closedAt = new Date().toISOString();
    const history = await fetchRouteHistory(routeId, {
        ...route,
        ended_at: closedAt,
    });

    if (!history) {
        throw new Error('No se pudo consultar el histórico de YPF para cerrar la ruta');
    }

    const historyRows = buildRouteLocationRows(routeId, history);
    return await routeRepository.closeRouteUnexpected({
        routeId,
        closedAt,
        updatedBy: userId,
        historyRows,
        observations,
    });
};

const deleteRouteIfPossible = async (routeId) => {
    const route = await routeRepository.getRouteHistoryContext(routeId);

    if (!route || route.deleted_at) {
        return null;
    }

    const summary = await routeRepository.getRouteClosureSummary(routeId);
    if (Number(summary.resolved_tickets) > 0) {
        throw new Error('No se puede eliminar una ruta con tickets resueltos');
    }

    return await routeRepository.deleteRouteLogically({ routeId });
};

const getAllRoutes = async (filters) => {
    return await routeRepository.findAll(filters);
};

const getRouteById = async (id) => {
    return await routeRepository.findById(id);
};

const getRouteClosureSummary = async (routeId) => {
    return await routeRepository.getRouteClosureSummary(routeId);
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

const closeRouteUnexpected = async (routeId, userId) => {
    const result = await closeRouteUnexpectedly(routeId, userId);

    if (!result) {
        return null;
    }

    return result;
};

const deleteRoute = async (routeId) => {
    return await deleteRouteIfPossible(routeId);
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

const toFiniteNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

const getClusterCenter = (tickets) => {
    return tickets.reduce((acc, ticket) => ({
        latitude: acc.latitude + ticket.latitude,
        longitude: acc.longitude + ticket.longitude,
    }), { latitude: 0, longitude: 0 });
};

const isTicketCompactEnough = (candidate, cluster, radiusKm) => {
    if (cluster.length === 0) return true;

    const center = getClusterCenter(cluster);
    const clusterCenterLat = center.latitude / cluster.length;
    const clusterCenterLng = center.longitude / cluster.length;

    const distanceToCenter = getDistanceFromLatLonInKm(
        clusterCenterLat,
        clusterCenterLng,
        candidate.latitude,
        candidate.longitude,
    );

    if (distanceToCenter > radiusKm) return false;

    return cluster.every((ticket) => (
        getDistanceFromLatLonInKm(ticket.latitude, ticket.longitude, candidate.latitude, candidate.longitude) <= radiusKm
    ));
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
    const normalizedTypeId = typeId !== undefined && typeId !== null ? toFiniteNumber(typeId, undefined) : undefined;
    const normalizedMaxPerRoute = Math.max(1, Math.trunc(toFiniteNumber(maxPerRoute, 10)));
    const normalizedRadius = Math.max(0.1, toFiniteNumber(radius, 2.0));
    const normalizedProximityWeight = Math.min(100, Math.max(0, toFiniteNumber(proximityWeight, 50)));
    const normalizedPriorityWeight = Math.min(100, Math.max(0, toFiniteNumber(priorityWeight, 50)));
    const normalizedMinTickets = Math.max(1, Math.trunc(toFiniteNumber(minTickets, 1)));

    // 1. Limpiar rutas planeadas anteriores del usuario
    await routeRepository.deletePlannedRoutes(userId);

    const unassignedTickets = await routeRepository.getUnassignedOpenTickets(normalizedTypeId, 'open', userId);
    if (!unassignedTickets || unassignedTickets.length === 0) return { routesCreated: 0 };

    // Filtramos tickets con coordenadas y les asignamos un valor numérico de prioridad (1-10)
    const pool = unassignedTickets
        .filter(t => Number.isFinite(Number(t.latitude)) && Number.isFinite(Number(t.longitude)))
        .map(t => ({
            ...t,
            // Aseguramos que latitude/longitude sean números
            latitude: parseFloat(t.latitude),
            longitude: parseFloat(t.longitude),
            priorityValue: getPriorityValue(t.tipo, t.subtipo, t.prioridad || t.priority)
        }));

    if (pool.length === 0) return { routesCreated: 0 };

    // Semilla de orden: depende de la preferencia del usuario
    if (normalizedProximityWeight >= normalizedPriorityWeight) {
        // Enfoque geográfico: empezamos por ubicación (Norte a Sur) para agrupar por zonas
        pool.sort((a, b) => b.latitude - a.latitude || a.longitude - b.longitude);
    } else {
        // Enfoque prioridad: empezamos por el ticket más urgente
        pool.sort((a, b) => b.priorityValue - a.priorityValue);
    }

    const routesToBatch = [];
    const usedTicketIds = new Set();

    // 3. Algoritmo de ruteo eficiente (Híbrido Dinámico)
    // En modo geográfico usamos un radio más estricto para evitar rutas “estiradas”.
    const effectiveRadius = normalizedProximityWeight >= normalizedPriorityWeight
        ? normalizedRadius * 0.7
        : normalizedRadius * (1 + Math.min(0.35, (normalizedPriorityWeight - normalizedProximityWeight) / 300));

    for (let i = 0; i < pool.length; i++) {
        const seed = pool[i];
        if (usedTicketIds.has(seed.id)) continue;

        usedTicketIds.add(seed.id);
        const currentRouteCluster = [seed];

        // Buscar candidatos en el resto de los tickets no usados
        const candidates = [];
        for (let j = i + 1; j < pool.length; j++) {
            const ticket = pool[j];
            if (usedTicketIds.has(ticket.id)) continue;

            const dist = getDistanceFromLatLonInKm(
                seed.latitude,
                seed.longitude,
                ticket.latitude,
                ticket.longitude
            );

            if (dist <= effectiveRadius && isTicketCompactEnough(ticket, currentRouteCluster, effectiveRadius)) {
                const distanceScore = 1 - (dist / effectiveRadius);
                const priorityScore = ticket.priorityValue / 10;
                const score = (normalizedProximityWeight * distanceScore) + (normalizedPriorityWeight * priorityScore);

                candidates.push({ ticket, score });
            }
        }

        // Ordenar candidatos por score descendente (mayor es mejor), igual que planner.service
        candidates.sort((a, b) => b.score - a.score);

        // Tomar los mejores candidatos para completar la ruta
        const ticketsToAdd = candidates.slice(0, normalizedMaxPerRoute - 1);
        for (const c of ticketsToAdd) {
            currentRouteCluster.push(c.ticket);
            usedTicketIds.add(c.ticket.id);
        }

        // Guardar grupo si cumple el mínimo
        if (currentRouteCluster.length >= normalizedMinTickets) {
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

const logCrewLocation = async (routeId, location) => {
    return await routeRepository.logCrewLocation({
        routeId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
    });
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

const getLatestCrewLocation = async (routeId) => {
    return await routeRepository.getLatestCrewLocation(routeId);
};

const getRoutesForLogin = async (userId) => {
    return await routeRepository.findForLogin(userId);
};

const addTicketsToRoute = async (routeId, ticketIds) => {
    return await routeRepository.addTicketsToRoute(routeId, ticketIds);
};

const getBacklogTickets = async (userId, routeId, filters) => {
    return await routeRepository.getBacklogTickets(userId, routeId, filters);
};

module.exports = {
    getAllRoutes,
    getRouteById,
    getRouteClosureSummary,
    createRoute,
    updateRoute,
    closeRouteUnexpected,
    deleteRoute,
    generateAdminRoutes,
    getAdminRoutes,
    confirmRoute,
    logEvent,
    logCrewLocation,
    updateTicketStatus,
    getTicketStatus,
    getVehicles,
    startRoute,
    getRouteHistory,
    getRouteLocations,
    getLatestCrewLocation,
    getRoutesForLogin,
    addTicketsToRoute,
    getBacklogTickets
};
