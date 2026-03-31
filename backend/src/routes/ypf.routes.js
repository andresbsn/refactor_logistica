const express = require('express');
const router = express.Router();
const ypfController = require('../controllers/ypf.controller');

router.get('/status', ypfController.getAuthStatus);
router.post('/session/refresh', ypfController.refreshSession);
router.get('/domains/:domain/:subdomain/users/:userId/devices', ypfController.getDevices);
router.get('/domains/:domain/:subdomain/users/:userId/devices/:deviceId/last-location', ypfController.getLastLocation);
router.get('/domains/:domain/:subdomain/users/:userId/devices/:deviceId/history', ypfController.getHistory);

module.exports = router;
