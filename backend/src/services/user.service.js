const userRepository = require('../repositories/user.repository');

const getCrewLeaders = async (userId) => {
    return await userRepository.findCrewLeadersByUserId(userId);
};

module.exports = {
    getCrewLeaders
};
