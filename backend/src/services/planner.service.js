const db = require('../config/db');
const ticketRepository = require('../repositories/ticket.repository');
const routeRepository = require('../repositories/route.repository');

/**
 * Calcula la distancia entre dos puntos (Haversine formula)
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

/**
 * Mapeo de prioridades según skills/ticket_priorities.md
 */
const PRIORITY_MAP = {
    3: { // Tipo Alumbrado
        6: 10,  // Falta de luminaria
        7: 10,  // Semáforo sin funcionar
        15: 4,  // Lámpara apagada
        default: 1
    },
    default: 4
};

function getPriorityValue(tipo, subtipo) {
    const typeMap = PRIORITY_MAP[tipo] || { default: PRIORITY_MAP.default };
    let val;
    if (typeof typeMap === 'number') {
        val = typeMap;
    } else {
        val = typeMap[subtipo] || typeMap.default;
    }

    // Solo devolver prioridad alta si es >= 7, sino prioridad base 1
    // Esto asegura que tickets con prioridad 'Media' o 'Baja' no fuercen la ruta
    // a menos que estén cerca.
    return val >= 7 ? val : 1;
}

const generatePlannedRoutes = async (params = {}) => {
    const client = await db.pool.connect();

    // Configuración desde params o defaults
    const proximityWeight = params.proximityWeight !== undefined ? params.proximityWeight : 50;
    const priorityWeight = params.priorityWeight !== undefined ? params.priorityWeight : 50;
    const maxTicketsPerRoute = params.maxPerRoute || 10;
    const maxRadius = (params.radius || 2) * 1000; // Convertir km a metros (default 2km)
    const minTicketsForRoute = params.minTickets || 2;

    try {
        await client.query('BEGIN');

        // 0. Limpiar rutas planeadas anteriores de forma atómica
        await client.query(`
            DELETE FROM log_route_ticket 
            WHERE route_id IN (SELECT id FROM log_routes WHERE planed = true)
        `);
        await client.query(`DELETE FROM log_routes WHERE planed = true`);

        // 1. Obtener tickets abiertos no asignados (filtrado por tipos permitidos si se implementa userId)
        const { rows: rawTickets } = await client.query(`
            SELECT t.id, t.latitude, t.longitude, t.nro_ticket, t.tipo, t.subtipo
            FROM tickets t
            LEFT JOIN log_route_ticket lrt ON t.id = lrt.ticket_id
            WHERE t.estado = 'open' 
            AND t.borrado IS NULL
            AND t.latitude IS NOT NULL 
            AND t.longitude IS NOT NULL
            AND lrt.id IS NULL
        `);

        if (rawTickets.length === 0) {
            console.log('No hay tickets de alumbrado pendientes para rutear.');
            await client.query('COMMIT');
            return { message: 'No tickets found', routesCreated: 0 };
        }

        // 2. Procesar tickets y asignar valor de prioridad una sola vez
        const tickets = rawTickets.map(t => ({
            ...t,
            priorityValue: getPriorityValue(t.tipo, t.subtipo),
            lat: parseFloat(t.latitude),
            lng: parseFloat(t.longitude)
        }));

        console.log(`Procesando ${tickets.length} tickets de alumbrado (Batch Optimized)`);

        const plannedRoutesGroups = [];
        const usedTicketIds = new Set();

        // Ordenar pool inicial según preferencia de peso
        let unassignedPool = [...tickets];
        if (proximityWeight >= priorityWeight) {
            unassignedPool.sort((a, b) => b.lat - a.lat || b.lng - a.lng);
        } else {
            unassignedPool.sort((a, b) => b.priorityValue - a.priorityValue);
        }

        // 3. Algoritmo de ruteo eficiente (evitamos filter() en cada iteración)
        for (let i = 0; i < unassignedPool.length; i++) {
            const seed = unassignedPool[i];
            if (usedTicketIds.has(seed.id)) continue;

            usedTicketIds.add(seed.id);
            let currentRouteTickets = [seed];

            // Buscar candidatos en el resto de los tickets no usados
            let candidates = [];
            for (let j = i + 1; j < unassignedPool.length; j++) {
                const ticket = unassignedPool[j];
                if (usedTicketIds.has(ticket.id)) continue;

                const distance = getDistance(seed.lat, seed.lng, ticket.lat, ticket.lng);

                if (distance <= maxRadius) {
                    const distanceScore = 1 - (distance / maxRadius);
                    const priorityScore = ticket.priorityValue / 10;
                    const finalScore = (proximityWeight * distanceScore) + (priorityWeight * priorityScore);

                    candidates.push({ ticket, score: finalScore });
                }
            }

            // Ordenar candidatos por score y agregar los mejores
            candidates.sort((a, b) => b.score - a.score);
            const toAdd = candidates.slice(0, maxTicketsPerRoute - 1);

            for (const item of toAdd) {
                currentRouteTickets.push(item.ticket);
                usedTicketIds.add(item.ticket.id);
            }

            plannedRoutesGroups.push(currentRouteTickets);
        }

        // 4. Inserción Masiva (BATCH INSERT) - Crucial para DB Remota
        let routesCount = 0;
        if (plannedRoutesGroups.length > 0) {
            // Bulk insert routes
            const routeRows = plannedRoutesGroups.map(() => '(true, true, NOW(), 1)');
            const routeRes = await client.query(`
                INSERT INTO log_routes (planed, is_active, created_at, created_by)
                VALUES ${routeRows.join(',')}
                RETURNING id
            `);
            const insertedRouteIds = routeRes.rows.map(r => r.id);

            // Bulk insert route-ticket associations
            const associations = [];
            const params = [];
            let pCounter = 1;

            insertedRouteIds.forEach((routeId, idx) => {
                const group = plannedRoutesGroups[idx];
                group.forEach(ticket => {
                    associations.push(`($${pCounter++}, $${pCounter++}, NOW())`);
                    params.push(routeId, ticket.id);
                });
            });

            if (associations.length > 0) {
                await client.query(`
                    INSERT INTO log_route_ticket (route_id, ticket_id, assigned_at)
                    VALUES ${associations.join(',')}
                `, params);
            }
            routesCount = insertedRouteIds.length;
        }

        await client.query('COMMIT');
        console.log(`Se generaron ${routesCount} rutas en lote.`);

        return {
            message: 'Success',
            routesCreated: routesCount,
            details: plannedRoutesGroups.map((g, i) => ({ routeId: 'batch', ticketCount: g.length }))
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en generatePlannedRoutes (Batch):', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    generatePlannedRoutes
};

