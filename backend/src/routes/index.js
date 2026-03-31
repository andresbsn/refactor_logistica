const { Router } = require('express');
const router = Router();

// Test route
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

// Import and use other routes here
router.use('/auth', require('./auth.routes'));
router.use('/tickets', require('./ticket.routes'));
router.use('/routes', require('./route.routes'));
router.use('/planner', require('./planner.routes'));
router.use('/users', require('./user.routes'));
router.use('/catalog', require('./catalog.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/ypf', require('./ypf.routes'));


module.exports = router;
