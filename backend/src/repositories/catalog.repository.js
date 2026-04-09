const db = require('../config/db');

const CatalogRepository = {
    getLogTareas: async () => {
        const query = `
            SELECT id, task_name 
            FROM log_tareas 
            WHERE task_name IS NOT NULL 
            ORDER BY task_name ASC, id ASC
        `;
        const { rows } = await db.query(query);
        return rows;
    }
};

module.exports = CatalogRepository;
