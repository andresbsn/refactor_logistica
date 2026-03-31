const CatalogRepository = require('../repositories/catalog.repository');

const CatalogService = {
    getTasksFromLog: async () => {
        const rows = await CatalogRepository.getLogTareas();
        // Return objects with id and name to be more robust in the frontend Select
        return rows.map((r, index) => ({
            id: `task-${index}`,
            name: r.task_name
        }));
    }
};


module.exports = CatalogService;
