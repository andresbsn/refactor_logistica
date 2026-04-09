const db = require('../config/db');

const resolveTaskTypeId = async (client, taskId, taskName) => {
    const query = `
        SELECT ltt.id
        FROM log_tarea_tipo ltt
        JOIN log_tareas lt ON lt.id = ltt.tareas_id
        WHERE ($1::text IS NOT NULL AND lt.id::text = $1::text)
           OR ($2::text IS NOT NULL AND lt.task_name = $2::text)
        ORDER BY ltt.id ASC
        LIMIT 1
    `;

    const { rows } = await client.query(query, [taskId ?? null, taskName ?? null]);
    return rows[0]?.id ?? null;
};

const registerClosingActivities = async ({ ticketId, taskIds = [], taskNames = [], agentId }) => {
    if (!ticketId) {
        throw new Error('ticketId is required');
    }

    if (!agentId) {
        throw new Error('agentId is required');
    }

    const entries = Math.max(taskIds.length, taskNames.length) > 0
        ? Array.from({ length: Math.max(taskIds.length, taskNames.length) }, (_, index) => ({
            taskId: taskIds[index] ?? null,
            taskName: taskNames[index] ?? null,
        }))
        : [];

    if (entries.length === 0) {
        return [];
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const insertedRows = [];

        for (const entry of entries) {
            const tipoTareaId = await resolveTaskTypeId(client, entry.taskId, entry.taskName);

            if (!tipoTareaId) {
                throw new Error(`No se encontró el tipo de tarea para ${entry.taskId || entry.taskName}`);
            }

            const { rows } = await client.query(
                `
                    INSERT INTO log_actividad_ticket (ticket_id, tipo_tarea_id, cantidad, agente_id, created_at)
                    VALUES ($1, $2, NULL, $3, NOW())
                    RETURNING *
                `,
                [ticketId, tipoTareaId, agentId]
            );

            insertedRows.push(rows[0]);
        }

        await client.query('COMMIT');
        return insertedRows;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    registerClosingActivities,
};
