const db = require('../config/db');

const getAllowedTypesByAgentId = async (agentId) => {
    const query = `
        SELECT DISTINCT
            ga.id AS group_id,
            ga.descripcion AS group_description,
            t.id AS type_id,
            t.texto AS type_text
        FROM sistema147.secr s
        JOIN sistema147.agentes_gruposagentes ag
            ON ag.id_agente_fk = s.unica
        JOIN sistema147.grupos_agentes ga
            ON ga.id = ag.id_grupoagente_fk
        JOIN sistema147.tipos t
            ON LOWER(TRIM(t.texto)) = LOWER(TRIM(ga.descripcion))
        WHERE s.unica = $1
          AND s.borrado = 0
          AND s.activa = 1
          AND ga.descripcion IS NOT NULL
          AND t.texto IS NOT NULL
        ORDER BY t.texto
    `;

    const { rows } = await db.query(query, [agentId]);
    return rows;
};

const getAllowedTypeIdsByAgentId = async (agentId) => {
    const rows = await getAllowedTypesByAgentId(agentId);
    return rows.map((row) => row.type_id);
};

module.exports = {
    getAllowedTypesByAgentId,
    getAllowedTypeIdsByAgentId,
};
