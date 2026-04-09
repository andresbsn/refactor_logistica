const CatalogRepository = require('../repositories/catalog.repository');

const CatalogService = {
    getTasksFromLog: async () => {
        const rows = await CatalogRepository.getLogTareas();
        return rows.map((r, index) => ({
            id: String(r.id ?? `task-${index}`),
            name: r.task_name
        }));
    }
};


module.exports = CatalogService;
