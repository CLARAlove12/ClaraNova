const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/admin', authenticate, authorize('admin'), dashboardController.getDashboardAdmin);
router.get('/bibliothecaire', authenticate, authorize('admin', 'bibliothecaire'), dashboardController.getDashboardBibliothecaire);
router.get('/lecteur', authenticate, dashboardController.getDashboardLecteur);

module.exports = router;