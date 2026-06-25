const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), auditController.getAuditLogs);
router.get('/mon-historique', authenticate, auditController.getMyAuditLogs);

module.exports = router;