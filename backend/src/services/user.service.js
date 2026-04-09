const userRepository = require('../repositories/user.repository');
const permissionRepository = require('../repositories/permission.repository');

const getCrewLeaders = async (userId) => {
    return await userRepository.findCrewLeadersByUserId(userId);
};

const getAllowedTypesByAgentId = async (agentId) => {
    return await permissionRepository.getAllowedTypesByAgentId(agentId);
};

const getAllowedTypeIdsByAgentId = async (agentId) => {
    return await permissionRepository.getAllowedTypeIdsByAgentId(agentId);
};

module.exports = {
    getCrewLeaders,
    getAllowedTypesByAgentId,
    getAllowedTypeIdsByAgentId,
};
