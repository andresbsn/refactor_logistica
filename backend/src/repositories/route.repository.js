const db = require('../config/db');

const findAll = async ({ limit = 1000, offset = 0, isActive, userId, planed }) => {
    console.log('findAll called with userId:', userId, 'planed:', planed);
    let query = `
        SELECT r.*, r.assigned_at AS "assignedAt",
        s.usuario AS "crewName",
        COALESCE(
            json_agg(
                json_build_object(
                    'id', t.id,
                    'ticketNumber', t.nro_ticket,
                    'asunto', t.asunto,
                    'estado', t.estado,
                    'latitude', t.latitude,
                    'longitude', t.longitude,
                    'dire_completa', t.dire_completa,
                    'barrio', b.descripcion,
                    'tipo', tipo.texto,
                    'subtipo', sub.texto,
                    'is_closed', lrt.is_closed,
                    'contacto_nombre', c.nombre,
                    'contacto_celular', c.celular,
                    'contacto_telefono', c.telefono
                )
            ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tickets
        FROM log_routes r
        LEFT JOIN secr s ON r.crew_id = s.unica
        LEFT JOIN log_route_ticket lrt ON r.id = lrt.route_id
        LEFT JOIN tickets t ON lrt.ticket_id = t.id
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN barrios b ON t.barrio = b.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
        query += ` AND r.is_active = $${paramIndex++}`;
        params.push(isActive === 'true');
    }

    if (planed !== undefined) {
        query += ` AND r.planed = $${paramIndex++}`;
        params.push(planed === 'true' || planed === true);
    }

    if (userId) {
        // First filter: ensure user only sees their own routes if they are planned
        // or routes they have permission for based on ticket types
        query += ` AND (
            (r.planed = true AND r.created_by = $${paramIndex})
            OR 
            (r.planed = false AND EXISTS (
                SELECT 1 FROM log_route_ticket lrt2
                JOIN tickets t2 ON lrt2.ticket_id = t2.id
                WHERE lrt2.route_id = r.id
                  AND t2.tipo IN (
                      SELECT tg.id_tipo 
                      FROM tipos_grupos tg
                      JOIN agentes_gruposagentes ag ON tg.id_grupo = ag.id_grupoagente_fk
                      WHERE ag.id_agente_fk = $${paramIndex}
                  )
            ))
            OR (r.planed = false AND r.crew_id = $${paramIndex})
            OR (r.planed = false AND NOT EXISTS (SELECT 1 FROM log_route_ticket lrt3 WHERE lrt3.route_id = r.id))
        )`;
        params.push(userId);
        paramIndex++;
    }

    query += ` GROUP BY r.id, s.usuario ORDER BY r.id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
};

const findById = async (id) => {
    const query = `
        SELECT r.*, r.assigned_at AS "assignedAt",
        s.usuario AS "crewName",
        COALESCE(
            json_agg(
                json_build_object(
                    'id', t.id,
                    'ticketNumber', t.nro_ticket,
                    'asunto', t.asunto,
                    'estado', t.estado,
                    'latitude', t.latitude,
                    'longitude', t.longitude,
                    'dire_completa', t.dire_completa,
                    'barrio', b.descripcion,
                    'tipo', tipo.texto,
                    'subtipo', sub.texto,
                    'is_closed', lrt.is_closed,
                    'contacto_nombre', c.nombre,
                    'contacto_celular', c.celular,
                    'contacto_telefono', c.telefono
                )
            ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tickets
        FROM log_routes r
        LEFT JOIN secr s ON r.crew_id = s.unica
        LEFT JOIN log_route_ticket lrt ON r.id = lrt.route_id
        LEFT JOIN tickets t ON lrt.ticket_id = t.id
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN barrios b ON t.barrio = b.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE r.id = $1
        GROUP BY r.id, s.usuario
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
};

const create = async (data) => {
    const { vehicle_id, crew_id, created_by, planed = true } = data;
    const query = `
        INSERT INTO log_routes (vehicle_id, crew_id, created_by, created_at, is_active, planed)
        VALUES ($1, $2, $3, NOW(), false, $4)
        RETURNING *
    `;
    const { rows } = await db.query(query, [vehicle_id, crew_id, created_by, planed]);
    return rows[0];
};

const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
    });

    if (fields.length === 0) return null;

    // Si se está asignando una cuadrilla, también actualizar assigned_at
    let assignedAtClause = "";
    if (data.crew_id) {
        assignedAtClause = ", assigned_at = NOW()";
    }

    values.push(id);
    const query = `UPDATE log_routes SET ${fields.join(', ')}, updated_at = NOW()${assignedAtClause} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getRouteHistoryContext = async (id) => {
    const query = `
        SELECT id, started_at, ended_at, vehicle_id, crew_id, created_by
        FROM log_routes
        WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
};

const getVehicleById = async (id) => {
    const query = `
        SELECT *
        FROM log_route_vehicle
        WHERE id = $1
        LIMIT 1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
};

const createPlannedRoute = async (ticketIds, userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const routeRes = await client.query(`
            INSERT INTO log_routes (created_at, is_active, planed, created_by)
            VALUES (NOW(), false, true, $1)
            RETURNING id
        `, [userId || null]);
        const routeId = routeRes.rows[0].id;

        for (const tid of ticketIds) {
            await client.query(`
                INSERT INTO log_route_ticket (route_id, ticket_id)
                VALUES ($1, $2)
            `, [routeId, tid]);
        }
        await client.query('COMMIT');
        return routeId;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getUnassignedOpenTickets = async (typeId, status = 'open', userId) => {
    let query = `
        SELECT t.* 
        FROM tickets t 
        WHERE t.estado = $1 
          AND t.borrado IS NULL
          AND t.latitude IS NOT NULL 
          AND t.longitude IS NOT NULL
          AND t.reiterado IS NULL
          AND t.cerrado IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM log_route_ticket lrt 
              JOIN log_routes r ON lrt.route_id = r.id
              WHERE lrt.ticket_id = t.id AND r.planed = false
          )
    `;
    const params = [status];
    let paramIndex = 2;

    if (typeId) {
        query += ` AND t.tipo = $${paramIndex++}`;
        params.push(typeId);
    } else if (userId) {
        // Si no se especifica tipo, usar los tipos permitidos para el usuario (como en el backlog)
        query += ` AND t.tipo IN (
            SELECT tg.id_tipo 
            FROM tipos_grupos tg
            JOIN agentes_gruposagentes ag ON tg.id_grupo = ag.id_grupoagente_fk
            WHERE ag.id_agente_fk = $${paramIndex++}
        )`;
        params.push(userId);
    }

    const { rows } = await db.query(query, params);
    return rows;
};

const deletePlannedRoutes = async (userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let deleteTicketsQuery = `
            DELETE FROM log_route_ticket 
            WHERE route_id IN (SELECT id FROM log_routes WHERE planed = true ${userId ? 'AND created_by = $1' : ''})
        `;
        let deleteRoutesQuery = `DELETE FROM log_routes WHERE planed = true ${userId ? 'AND created_by = $1' : ''}`;

        const params = userId ? [userId] : [];

        // Eliminamos los vínculos de tickets de rutas planeadas
        await client.query(deleteTicketsQuery, params);
        // Eliminamos las rutas planeadas
        await client.query(deleteRoutesQuery, params);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const addTicketsToRoute = async (routeId, ticketIds) => {
    if (!routeId || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return { added: 0 };
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let added = 0;
        for (const ticketId of ticketIds) {
            const existingCheck = await client.query(`
                SELECT 1 FROM log_route_ticket 
                WHERE route_id = $1 AND ticket_id = $2
            `, [routeId, ticketId]);

            if (existingCheck.rows.length === 0) {
                await client.query(`
                    INSERT INTO log_route_ticket (route_id, ticket_id)
                    VALUES ($1, $2)
                `, [routeId, ticketId]);
                added++;
            }
        }

        await client.query('COMMIT');
        return { added };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getBacklogTickets = async (userId, routeId, { limit = 100, offset = 0, search, type, priority } = {}) => {
    const normalizedLimit = Math.min(parseInt(limit) || 100, 1000);
    const normalizedOffset = Math.max(parseInt(offset) || 0, 0);

    let filters = [];
    let params = [];

    const baseConditions = [
        't.borrado IS NULL',
        't.latitude IS NOT NULL',
        't.longitude IS NOT NULL',
        't.reiterado IS NULL',
        't.cerrado IS NULL',
        "t.estado = 'open'"
    ];
    filters.push(baseConditions.join(' AND '));

    if (userId) {
        filters.push(`t.tipo IN (SELECT tg.id_tipo FROM tipos_grupos tg JOIN agentes_gruposagentes ag ON tg.id_grupo = ag.id_grupoagente_fk WHERE ag.id_agente_fk = $${params.length + 1})`);
        params.push(userId);
    }

    if (routeId) {
        filters.push(`NOT EXISTS (SELECT 1 FROM log_route_ticket lrt JOIN log_routes r ON lrt.route_id = r.id WHERE lrt.ticket_id = t.id AND r.deleted_at IS NULL)`);
    }

    if (type) {
        filters.push(`t.tipo = $${params.length + 1}`);
        params.push(type);
    }

    if (priority) {
        filters.push(`t.prioridad = $${params.length + 1}`);
        params.push(priority);
    }

    if (search) {
        const searchValue = `%${search}%`;
        filters.push(`(t.asunto ILIKE $${params.length + 1} OR t.nro_ticket::text ILIKE $${params.length + 1})`);
        params.push(searchValue);
    }

    const whereClause = filters.join(' AND ');

    const query = `
        SELECT 
            t.id, 
            t.nro_ticket, 
            t.asunto, 
            t.dire_completa, 
            t.barrio, 
            t.latitude, 
            t.longitude, 
            t.estado, 
            t.prioridad, 
            t.tipo, 
            t.subtipo, 
            t.creado,
            t.contacto,
            tipo.texto as tipo_nombre, 
            sub.texto as subtipo_nombre,
            c.celular as contacto_celular,
            c.telefono as contacto_telefono,
            c.nombre as contacto_nombre
        FROM tickets t
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE ${whereClause}
        ORDER BY t.creado DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(normalizedLimit, normalizedOffset);
    const { rows } = await db.query(query, params);
    return rows;
};

const confirmRoute = async (id, data) => {
    const { crew_id, vehicle_id } = data;

    const checkActiveRoute = `
        SELECT id FROM log_routes 
        WHERE crew_id = $1 AND is_active = true 
        LIMIT 1
    `;
    const { rows: activeRoute } = await db.query(checkActiveRoute, [crew_id]);

    if (activeRoute.length > 0) {
        throw new Error('No se puede asignar la nueva ruta porque la cuadrilla ya tiene una activa');
    }

    const query = `
        UPDATE log_routes 
        SET crew_id = $1, 
            vehicle_id = $2, 
            planed = false, 
            is_active = false,
            updated_at = NOW(),
            assigned_at = NOW() 
        WHERE id = $3 
        RETURNING *
    `;
    const { rows } = await db.query(query, [crew_id, vehicle_id, id]);
    return rows[0];
};

const createPlannedRoutesBatch = async (routesData, userId) => {
    if (!routesData.length) return 0;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar las rutas en una sola query
        const routeValues = [];
        const routeRows = routesData.map((_, i) => {
            if (userId) {
                routeValues.push(userId);
                return `(NOW(), false, true, $${routeValues.length})`;
            }
            return '(NOW(), false, true, NULL)';
        });

        const { rows: insertedRoutes } = await client.query(`
            INSERT INTO log_routes (created_at, is_active, planed, created_by)
            VALUES ${routeRows.join(',')}
            RETURNING id
        `, routeValues);
        const routeIds = insertedRoutes.map(r => r.id);

        // 2. Insertar todas las asociaciones ticket-ruta en una sola query
        const associationRows = [];
        const params = [];
        let pIndex = 1;

        routeIds.forEach((routeId, i) => {
            const ticketIds = routesData[i];
            ticketIds.forEach(tid => {
                associationRows.push(`($${pIndex++}, $${pIndex++})`);
                params.push(routeId, tid);
            });
        });

        if (associationRows.length > 0) {
            await client.query(`
                INSERT INTO log_route_ticket (route_id, ticket_id)
                VALUES ${associationRows.join(',')}
            `, params);
        }

        await client.query('COMMIT');
        return routeIds.length;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error in createPlannedRoutesBatch:', e);
        throw e;
    } finally {
        client.release();
    }
};

const logEvent = async (routeId, ticketId, eventNumber) => {
    const normalizedTicketId = ticketId === 'null' || ticketId === undefined ? null : ticketId;
    const query = `
        INSERT INTO log_route_locations (route_id, ticket_id, event_id, timestamp, coordinates)
        VALUES ($1, $2, $3, NOW(), $4)
        RETURNING *
    `;
    const { rows } = await db.query(query, [routeId, normalizedTicketId, eventNumber, null]);
    return rows[0];
};

const insertRouteLocations = async (locations) => {
    if (!locations || locations.length === 0) {
        return []; 
    }

    const values = [];
    const placeholders = locations.map((location, index) => {
        const baseIndex = index * 5;
        const pointEwkt = `SRID=4326;POINT(${Number(location.longitude)} ${Number(location.latitude)})`;
        values.push(
            location.routeId,
            location.ticketId ?? null,
            location.eventId,
            location.timestamp,
            pointEwkt,
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}::public.geometry(Point,4326))`;
    });

    const query = `
        INSERT INTO log_route_locations (route_id, ticket_id, event_id, timestamp, coordinates)
        VALUES ${placeholders.join(', ')}
        RETURNING *
    `;
    const { rows } = await db.query(query, values);
    return rows;
};

const updateTicketStatus = async (routeId, ticketId, statusData) => {
    const fields = [];
    const values = [routeId, ticketId];
    let paramIndex = 3;

    Object.entries(statusData).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
    });

    if (fields.length === 0) return null;

    const query = `
        UPDATE log_route_ticket 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE route_id = $1 AND ticket_id = $2
        RETURNING *
    `;
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getTicketStatus = async (routeId, ticketId) => {
    const statusQuery = `
        SELECT * FROM log_route_ticket
        WHERE route_id = $1 AND ticket_id = $2
    `;
    const { rows: statusRows } = await db.query(statusQuery, [routeId, ticketId]);

    const eventsQuery = `
        SELECT event_id, timestamp FROM log_route_locations
        WHERE route_id = $1 AND ticket_id = $2
        ORDER BY timestamp ASC
    `;
    const { rows: eventsRows } = await db.query(eventsQuery, [routeId, ticketId]);

    const status = statusRows[0] || null;
    if (status) {
        status.events = eventsRows;
    }

    return status;
};

const getRouteLocations = async (routeId, eventId = 5) => {
    const query = `
        SELECT
            id,
            route_id,
            ticket_id,
            event_id,
            timestamp,
            coordinates::text AS coordinates
        FROM log_route_locations
        WHERE route_id = $1 AND event_id = $2
        ORDER BY timestamp ASC, id ASC
    `;
    const { rows } = await db.query(query, [routeId, eventId]);
    return rows;
};

const getVehicles = async () => {
    const query = `
        SELECT * 
        FROM log_route_vehicle
        ORDER BY brand
    `;
    const { rows } = await db.query(query);
    return rows;
};

const startRoute = async (routeId, vehicleId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE log_routes 
            SET is_active = true, started_at = NOW(), vehicle_id = $2, updated_at = NOW()
            WHERE id = $1 AND is_active = false AND started_at IS NULL
            RETURNING *
        `;
        const { rows } = await client.query(updateQuery, [routeId, vehicleId]);

        if (!rows[0]) {
            await client.query('ROLLBACK');
            return null;
        }

        await client.query(
            `
                INSERT INTO log_route_locations (route_id, ticket_id, event_id, timestamp, coordinates)
                VALUES ($1, NULL, 1, NOW(), NULL)
            `,
            [routeId]
        );

        await client.query('COMMIT');
        return rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const findForLogin = async (userId) => {
    const query = `
        SELECT r.*, r.assigned_at AS "assignedAt",
        s.usuario AS "crewName",
        COALESCE(
            json_agg(
                json_build_object(
                    'id', t.id,
                    'ticketNumber', t.nro_ticket,
                    'asunto', t.asunto,
                    'estado', t.estado,
                    'latitude', t.latitude,
                    'longitude', t.longitude,
                    'dire_completa', t.dire_completa,
                    'barrio', b.descripcion,
                    'tipo', tipo.texto,
                    'subtipo', sub.texto,
                    'is_closed', lrt.is_closed,
                    'contacto_nombre', c.nombre,
                    'contacto_celular', c.celular,
                    'contacto_telefono', c.telefono
                )
            ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tickets
        FROM log_routes r
        LEFT JOIN secr s ON r.crew_id = s.unica
        LEFT JOIN log_route_ticket lrt ON r.id = lrt.route_id
        LEFT JOIN tickets t ON lrt.ticket_id = t.id
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN barrios b ON t.barrio = b.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE r.crew_id = $1 OR r.created_by = $1
        GROUP BY r.id, s.usuario
        ORDER BY r.created_at DESC
        LIMIT 20
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    getRouteHistoryContext,
    getVehicleById,
    getRouteLocations,
    createPlannedRoute,
    createPlannedRoutesBatch,
    getUnassignedOpenTickets,
    deletePlannedRoutes,
    confirmRoute,
    logEvent,
    insertRouteLocations,
    updateTicketStatus,
    getTicketStatus,
    getVehicles,
    startRoute,
    findForLogin,
    addTicketsToRoute,
    getBacklogTickets
};

