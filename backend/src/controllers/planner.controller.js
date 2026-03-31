const plannerService = require('../services/planner.service');

const runAutoPlanner = async (req, res, next) => {
    try {
        const result = await plannerService.generatePlannedRoutes(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    runAutoPlanner
};
