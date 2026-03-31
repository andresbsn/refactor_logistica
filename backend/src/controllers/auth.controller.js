const authService = require('../services/auth.service');

const login = async (req, res, next) => {
    try {
        console.log(req.body);
        const { username, password } = req.body;
        console.log(username, password);
        const result = await authService.login(username, password);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    login
};
