const { Router } = require('express');
const CatalogController = require('../controllers/catalog.controller');
const router = Router();

router.get('/tasks', CatalogController.getTasks);
router.get('/materials', CatalogController.getMaterials);

module.exports = router;
