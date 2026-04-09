const routeService = require('../services/route.service');

const parseRequiredId = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

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
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const route = await routeService.getRouteById(routeId);
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
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const updatedRoute = await routeService.updateRoute(routeId, req.body);
        if (!updatedRoute) return res.status(404).json({ message: 'Route not found' });
        res.json(updatedRoute);
    } catch (error) {
        next(error);
    }
};

const generateAdminRoutes = async (req, res, next) => {
    try {
        const { proximityWeight, priorityWeight, maxPerRoute, radius, minTickets, typeId } = req.body;
        const normalizedTypeId = typeId !== undefined && typeId !== null ? parseRequiredId(typeId) : undefined;

        if (typeId !== undefined && typeId !== null && !normalizedTypeId) {
            return res.status(400).json({ message: 'Invalid type id' });
        }

        // Armamos rutas según los tipos permitidos para el usuario
        const result = await routeService.generateAdminRoutes({
            typeId: normalizedTypeId,
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
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const result = await routeService.confirmRoute(routeId, req.body);
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
        const routeId = parseRequiredId(req.params.id);
        const ticketId = req.params.ticketId === 'null' ? null : parseRequiredId(req.params.ticketId);
        const eventNumber = parseRequiredId(req.body.eventNumber);

        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        if (req.params.ticketId !== 'null' && !ticketId) {
            return res.status(400).json({ message: 'Invalid ticket id' });
        }

        if (!eventNumber) {
            return res.status(400).json({ message: 'Invalid event number' });
        }

        const normalizedTicketId = ticketId === 'null' ? null : ticketId;
        const result = await routeService.logEvent(routeId, normalizedTicketId, eventNumber);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        const ticketId = parseRequiredId(req.params.ticketId);

        if (!routeId || !ticketId) {
            return res.status(400).json({ message: 'Invalid route or ticket id' });
        }

        const result = await routeService.updateTicketStatus(routeId, ticketId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getTicketStatus = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        const ticketId = parseRequiredId(req.params.ticketId);

        if (!routeId || !ticketId) {
            return res.status(400).json({ message: 'Invalid route or ticket id' });
        }

        const result = await routeService.getTicketStatus(routeId, ticketId);
        res.json(result || { inprocess: false });
    } catch (error) {
        next(error);
    }
};

const getRouteLocations = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const eventId = req.query.eventId ? parseInt(req.query.eventId, 10) : 5;
        const rows = await routeService.getRouteLocations(routeId, Number.isNaN(eventId) ? 5 : eventId);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const saveCrewLocation = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        const latitude = Number(req.body?.latitude);
        const longitude = Number(req.body?.longitude);
        const timestamp = typeof req.body?.timestamp === 'string' && req.body.timestamp.trim() ? req.body.timestamp.trim() : new Date().toISOString();

        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        const result = await routeService.logCrewLocation(routeId, { latitude, longitude, timestamp });
        if (!result) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const getLatestCrewLocation = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const result = await routeService.getLatestCrewLocation(routeId);
        res.json(result || null);
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
        const routeId = parseRequiredId(req.body.routeId);
        const vehicleId = parseRequiredId(req.body.vehicleId);

        if (!routeId || !vehicleId) {
            return res.status(400).json({ message: 'Invalid route or vehicle id' });
        }

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
        const userId = parseRequiredId(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const routes = await routeService.getRoutesForLogin(userId);
        res.json(routes);
    } catch (error) {
        next(error);
    }
};

const closeUnexpectedRoute = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const observations = typeof req.body?.observations === 'string' ? req.body.observations.trim() : '';
        const result = await routeService.closeRouteUnexpected(routeId, req.user?.id, observations);
        if (!result) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

const deleteRoute = async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const routeId = parseRequiredId(req.params.id);
        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        const result = await routeService.deleteRoute(routeId);
        if (!result) {
            return res.status(404).json({ message: 'Route not found' });
        }

res.json(result);
    } catch (error) {
        if (error.message === 'No se puede eliminar una ruta con tickets resueltos') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const addTicketsToRoute = async (req, res, next) => {
    try {
        const routeId = parseRequiredId(req.params.id);
        const { ticketIds = [] } = req.body || {};

        if (!routeId) {
            return res.status(400).json({ message: 'Invalid route id' });
        }

        if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({ message: 'No tickets provided' });
        }

        const normalizedTicketIds = ticketIds
            .map(id => parseRequiredId(id))
            .filter(id => id !== null);

        if (normalizedTicketIds.length === 0) {
            return res.status(400).json({ message: 'Invalid ticket ids' });
        }

        const result = await routeService.addTicketsToRoute(routeId, normalizedTicketIds);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getBacklogTickets = async (req, res, next) => {
    try {
        const { limit, offset, search, type, priority } = req.query;
        const routeId = req.params.id ? parseRequiredId(req.params.id) : null;

        const filters = { limit, offset, search, type, priority };
        const tickets = await routeService.getBacklogTickets(req.user.id, routeId, filters);
        res.json(tickets);
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
    saveCrewLocation,
    getLatestCrewLocation,
    getVehicles,
    startRoute,
    getRoutesForLogin,
    closeUnexpectedRoute,
    deleteRoute,
    addTicketsToRoute,
    getBacklogTickets
};
