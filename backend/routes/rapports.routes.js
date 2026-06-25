const express = require('express');
const router = express.Router();
const rapportsController = require('../controllers/rapports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/emprunts', authenticate, authorize('admin', 'bibliothecaire'), rapportsController.getRapportEmprunts);
router.get('/penalites', authenticate, authorize('admin'), rapportsController.getRapportPenalites);

module.exports = router;