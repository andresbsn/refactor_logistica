const ticketActivityRepository = require('../repositories/ticket.activity.repository');

const registerClosingActivities = async (payload) => {
    return await ticketActivityRepository.registerClosingActivities(payload);
};

module.exports = {
    registerClosingActivities,
};
