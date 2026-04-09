const ticketService = require('../services/ticket.service');
const ticketActivityService = require('../services/ticket.activity.service');

const getAllTickets = async (req, res, next) => {
    try {
        const { limit, offset, status, type, priority, neighborhood, search, hasCoordinates } = req.query;
        const tickets = await ticketService.findAll({
            limit: parseInt(limit) || 1000,
            offset: parseInt(offset) || 0,
            status,
            type,
            priority,
            neighborhood,
            search,
            hasCoordinates: hasCoordinates === 'true',
            userId: req.user.id
        });
        res.json(tickets);
    } catch (error) {
        next(error);
    }
};

const getTicketById = async (req, res, next) => {
    try {
        const ticket = await ticketService.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        next(error);
    }
};

const getOpenTickets = async (req, res, next) => {
    try {
        const tickets = await ticketService.findAll({
            status: 'open',
            userId: req.user.id
        });
        res.json(tickets);
    } catch (error) {
        next(error);
    }
};

const registerClosingActivity = async (req, res, next) => {
    try {
        const { id: ticketId } = req.params;
        const { taskIds = [], taskNames = [] } = req.body || {};

        const activities = await ticketActivityService.registerClosingActivities({
            ticketId,
            taskIds: Array.isArray(taskIds) ? taskIds : [],
            taskNames: Array.isArray(taskNames) ? taskNames : [],
            agentId: req.user.id,
        });

        res.status(201).json({ activities });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTickets,
    getTicketById,
    getOpenTickets,
    registerClosingActivity,
};
