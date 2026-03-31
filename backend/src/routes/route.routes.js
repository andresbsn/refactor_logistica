const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public route for login check (without auth middleware) - MUST be before authMiddleware
router.get('/for-login/:userId', routeController.getRoutesForLogin);

router.use(authMiddleware);

router.get('/', routeController.getAllRoutes);
router.get('/admin', routeController.getAdminRoutes);
router.post('/admin/generate', routeController.generateAdminRoutes);
router.patch('/admin/:id/confirm', routeController.confirmRoute);
router.get('/vehicles', routeController.getVehicles);
router.get('/:id', routeController.getRouteById);
router.post('/', routeController.createRoute);
router.patch('/:id', routeController.updateRoute);
router.post('/:id/tickets/:ticketId/event', routeController.logEvent);
router.get('/:id/tickets/:ticketId/status', routeController.getTicketStatus);
router.get('/:id/locations', routeController.getRouteLocations);
router.post('/start', routeController.startRoute);
router.patch('/:id/tickets/:ticketId/status', routeController.updateTicketStatus);

module.exports = router;
