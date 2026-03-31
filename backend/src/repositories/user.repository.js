const db = require('../config/db');

const findByUsername = async (username) => {
    const { rows } = await db.query(
        'SELECT * FROM secr WHERE usuario = $1 AND borrado = 0',
        [username]
    );
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await db.query(
        'SELECT * FROM secr WHERE unica = $1 AND borrado = 0',
        [id]
    );
    return rows[0] || null;
};

const findCrewLeadersByUserId = async (userId) => {
    const query = `
        SELECT DISTINCT s.*
        FROM sistema147.secr s
        JOIN sistema147.agentes_gruposagentes ag ON s.unica = ag.id_agente_fk
        WHERE nivel_app = 'LIDER_CUADRILLA' and activa = 1 and ag.id_grupoagente_fk IN (
            SELECT ag2.id_grupoagente_fk
            FROM sistema147.agentes_gruposagentes ag2
            JOIN sistema147.secr s2 ON s2.unica = ag2.id_agente_fk
            WHERE s2.unica = $1
        )
        ORDER BY s.usuario
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
};

module.exports = {
    findByUsername,
    findById,
    findCrewLeadersByUserId
};
