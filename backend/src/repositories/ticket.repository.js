const db = require('../config/db');

const findAll = async ({ limit = 1000, offset = 0, status, type, priority, neighborhood, search, userId, hasCoordinates }) => {
    let query = `
        SELECT 
            t.*, 
            tipo.texto as tipo_nombre, 
            sub.texto as subtipo_nombre,
            c.celular as contacto_celular,
            c.telefono as contacto_telefono,
            c.nombre as contacto_nombre
        FROM tickets t
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE t.borrado IS NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (hasCoordinates) {
        query += ` AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL`;
    }

    if (userId) {
        query += ` AND t.tipo IN (
            SELECT tg.id_tipo 
            FROM tipos_grupos tg
            JOIN agentes_gruposagentes ag ON tg.id_grupo = ag.id_grupoagente_fk
            WHERE ag.id_agente_fk = $${paramIndex++}
        )`;
        params.push(userId);
    }

    if (status) {
        query += ` AND t.estado = $${paramIndex++}`;
        params.push(status);
    }
    if (type) {
        query += ` AND t.tipo = $${paramIndex++}`;
        params.push(type);
    }
    if (priority) {
        query += ` AND t.prioridad = $${paramIndex++}`;
        params.push(priority);
    }
    if (neighborhood) {
        query += ` AND t.barrio = $${paramIndex++}`;
        params.push(neighborhood);
    }
    if (search) {
        query += ` AND (t.asunto ILIKE $${paramIndex} OR t.nro_ticket::text ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    query += ` ORDER BY t.creado DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
};

const findById = async (id) => {
    const { rows } = await db.query(`
        SELECT 
            t.*, 
            tipo.texto as tipo_nombre, 
            sub.texto as subtipo_nombre,
            c.celular as contacto_celular,
            c.telefono as contacto_telefono,
            c.nombre as contacto_nombre
        FROM tickets t
        LEFT JOIN tipos tipo ON t.tipo = tipo.id
        LEFT JOIN subtipos sub ON t.subtipo = sub.id
        LEFT JOIN contactos c ON t.contacto = c.id
        WHERE t.id = $1
    `, [id]);
    return rows[0] || null;
};

const create = async (data) => {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO tickets (${columns}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0];
};

module.exports = {
    findAll,
    findById,
    create
};
