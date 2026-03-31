const CatalogService = require('../services/catalog.service');

const CatalogController = {
    getTasks: async (req, res, next) => {
        try {
            const tasks = await CatalogService.getTasksFromLog();
            res.json({ tasks });
        } catch (error) {
            next(error);
        }
    },

    getMaterials: async (req, res, next) => {
        try {
            // According to user request, material selector should also show tasks from log_tareas
            const tasks = await CatalogService.getTasksFromLog();
            // We map them to the material format expected by frontend: { id, name }
            // Note: service now returns [{id, name}], so we use task.name
            const materials = tasks.map((task, index) => ({
                id: task.id || `task-${index}`,
                name: task.name,
                code: `T-${index}`,
                unit: 'u',
                quantity: 999 
            }));
            res.json({ materials });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = CatalogController;
