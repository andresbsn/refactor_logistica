const userService = require('../services/user.service');

const getMyCrewLeaders = async (req, res, next) => {
    try {
        const leaders = await userService.getCrewLeaders(req.user.id);
        res.json(leaders);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyCrewLeaders
};
