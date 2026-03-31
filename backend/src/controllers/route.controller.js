const routeService = require('../services/route.service');

const getAllRoutes = async (req, res, next) => {
    try {
        const { limit, offset, isActive, planed } = req.query;
        const filters = {
            limit: parseInt(limit) || 1000,
            offset: parseInt(offset) || 0,
            isActive,
            planed
        };

        // Si el usuario no es admin, filtramos por su ID para que solo vea sus rutas
        if (req.user && req.user.role !== 'admin') {
            filters.userId = req.user.id;
        }

        const routes = await routeService.getAllRoutes(filters);
        res.json(routes);
    } catch (error) {
        next(error);
    }
};

const getRouteById = async (req, res, next) => {
    try {
        const route = await routeService.getRouteById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (error) {
        next(error);
    }
};

const createRoute = async (req, res, next) => {
    try {
        const newRoute = await routeService.createRoute(req.body);
        res.status(201).json(newRoute);
    } catch (error) {
        next(error);
    }
};

const updateRoute = async (req, res, next) => {
    try {
        const updatedRoute = await routeService.updateRoute(req.params.id, req.body);
        if (!updatedRoute) return res.status(404).json({ message: 'Route not found' });
        res.json(updatedRoute);
    } catch (error) {
        next(error);
    }
};

const generateAdminRoutes = async (req, res, next) => {
    try {
        const { proximityWeight, priorityWeight, maxPerRoute, radius, minTickets } = req.body;
        // Armamos rutas según los tipos permitidos para el usuario
        const result = await routeService.generateAdminRoutes({
            userId: req.user.id,
            proximityWeight: proximityWeight !== undefined ? proximityWeight : 50,
            priorityWeight: priorityWeight !== undefined ? priorityWeight : 50,
            maxPerRoute: maxPerRoute || 10,
            radius: radius || 2.0,
            minTickets: minTickets || 1
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getAdminRoutes = async (req, res, next) => {
    try {
        const routes = await routeService.getAdminRoutes({
            ...req.query,
            userId: req.user.id
        });
        res.json(routes);
    } catch (error) {
        next(error);
    }
};

const confirmRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await routeService.confirmRoute(id, req.body);
        if (!result) return res.status(404).json({ message: 'Route not found' });
        res.json(result);
    } catch (error) {
        if (error.message === 'No se puede asignar la nueva ruta porque la cuadrilla ya tiene una activa') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const logEvent = async (req, res, next) => {
    try {
        const { id, ticketId } = req.params;
        const { eventNumber } = req.body;
        const normalizedTicketId = ticketId === 'null' ? null : ticketId;
        const result = await routeService.logEvent(id, normalizedTicketId, eventNumber);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { id, ticketId } = req.params;
        const result = await routeService.updateTicketStatus(id, ticketId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getTicketStatus = async (req, res, next) => {
    try {
        const { id, ticketId } = req.params;
        const result = await routeService.getTicketStatus(id, ticketId);
        res.json(result || { inprocess: false });
    } catch (error) {
        next(error);
    }
};

const getRouteLocations = async (req, res, next) => {
    try {
        const { id } = req.params;
        const eventId = req.query.eventId ? parseInt(req.query.eventId, 10) : 5;
        const rows = await routeService.getRouteLocations(id, Number.isNaN(eventId) ? 5 : eventId);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const getVehicles = async (req, res, next) => {
    try {
        const vehicles = await routeService.getVehicles();
        res.json(vehicles);
    } catch (error) {
        next(error);
    }
};

const startRoute = async (req, res, next) => {
    try {
        const { routeId, vehicleId } = req.body;
        const result = await routeService.startRoute(routeId, vehicleId);
        if (!result) {
            return res.status(404).json({ message: 'Ruta no encontrada o ya está activa' });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getRoutesForLogin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const routes = await routeService.getRoutesForLogin(userId);
        res.json(routes);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    generateAdminRoutes,
    getAdminRoutes,
    confirmRoute,
    logEvent,
    updateTicketStatus,
    getTicketStatus,
    getRouteLocations,
    getVehicles,
    startRoute,
    getRoutesForLogin
};
