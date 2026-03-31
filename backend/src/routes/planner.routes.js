const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/planner.controller');

// Trigger automatic planning
router.post('/generate', plannerController.runAutoPlanner);

module.exports = router;
