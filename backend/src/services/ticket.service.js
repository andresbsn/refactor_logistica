const ticketRepository = require('../repositories/ticket.repository');

const findAll = async (filters) => {
    return await ticketRepository.findAll(filters);
};

const findById = async (id) => {
    return await ticketRepository.findById(id);
};

const create = async (data) => {
    return await ticketRepository.create(data);
};

module.exports = {
    findAll,
    findById,
    create
};
