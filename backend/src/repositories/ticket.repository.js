const db = require('../config/db');
const { createSqlFilterBuilder } = require('../utils/sql-filter-builder');

const findAll = async ({ limit = 1000, offset = 0, status, type, priority, neighborhood, search, userId, hasCoordinates }) => {
    const filters = createSqlFilterBuilder({
        baseConditions: ['t.borrado IS NULL'],
    });

    if (hasCoordinates) {
        filters.addRaw('t.latitude IS NOT NULL AND t.longitude IS NOT NULL');
    }

    if (userId) {
        filters.add(
            't.tipo IN (SELECT tg.id_tipo FROM tipos_grupos tg JOIN agentes_gruposagentes ag ON tg.id_grupo = ag.id_grupoagente_fk WHERE ag.id_agente_fk = ?)',
            userId,
        );
    }

    if (status) {
        filters.add('t.estado = ?', status);
    }

    if (type) {
        filters.add('t.tipo = ?', type);
    }

    if (priority) {
        filters.add('t.prioridad = ?', priority);
    }

    if (neighborhood) {
        filters.add('t.barrio = ?', neighborhood);
    }

    if (search) {
        const searchValue = `%${search}%`;
        filters.add('(t.asunto ILIKE ? OR t.nro_ticket::text ILIKE ?)', [searchValue, searchValue]);
    }

    const query = `
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
        WHERE ${filters.build()}
    `;

    const params = [...filters.params, limit, offset];
    const limitParamIndex = filters.params.length + 1;
    const offsetParamIndex = limitParamIndex + 1;

    const paginatedQuery = `${query} ORDER BY t.creado DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;

    const { rows } = await db.query(paginatedQuery, params);
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
