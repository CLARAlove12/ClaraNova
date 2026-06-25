const express = require('express');
const router = express.Router();
const penalitesController = require('../controllers/penalites.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const penaliteIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'), validate,
];

router.get('/mes-penalites', authenticate, penalitesController.getMyPenalites);
router.get('/', authenticate, authorize('admin', 'bibliothecaire'), penalitesController.getAllPenalites);
router.get('/:id', authenticate, penaliteIdValidator, penalitesController.getPenaliteById);
router.patch('/:id/payer', authenticate, authorize('admin', 'bibliothecaire'), penaliteIdValidator, auditLog('PAYER_PENALITE'), penalitesController.marquerPenalitePayee);

module.exports = router;