const express = require('express');
const router = express.Router();
const retoursController = require('../controllers/retours.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createRetourValidator, retourIdValidator } = require('../validators/retours.validator');

router.get('/', authenticate, authorize('admin', 'bibliothecaire'), retoursController.getAllRetours);
router.get('/:id', authenticate, authorize('admin', 'bibliothecaire'), retourIdValidator, retoursController.getRetourById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createRetourValidator, auditLog('CREATE_RETOUR'), retoursController.createRetour);

module.exports = router;