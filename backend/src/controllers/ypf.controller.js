const ypfService = require('../services/ypf.service');

const getAuthStatus = async (req, res, next) => {
    try {
        const status = await ypfService.getAuthStatus();
        res.json(status);
    } catch (error) {
        next(error);
    }
};

const refreshSession = async (req, res, next) => {
    try {
        const session = await ypfService.refreshSession();
        res.json(session);
    } catch (error) {
        next(error);
    }
};

const getDevices = async (req, res, next) => {
    try {
        const { domain, subdomain, userId } = req.params;
        const { page = 0, pageSize = 200 } = req.query;
        const result = await ypfService.getDevices({
            domain,
            subdomain,
            userId,
            page,
            pageSize,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getLastLocation = async (req, res, next) => {
    try {
        const { domain, subdomain, userId, deviceId } = req.params;
        const result = await ypfService.getLastLocation({
            domain,
            subdomain,
            userId,
            deviceId,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getHistory = async (req, res, next) => {
    try {
        const { domain, subdomain, userId, deviceId } = req.params;
        const { from, to, page = 0, pageSize = 2000 } = req.query;
        const result = await ypfService.getHistory({
            domain,
            subdomain,
            userId,
            deviceId,
            from,
            to,
            page,
            pageSize,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAuthStatus,
    refreshSession,
    getDevices,
    getLastLocation,
    getHistory,
};
