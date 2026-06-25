const express = require('express');
const router = express.Router();
const paiementsController = require('../controllers/paiements.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createPaiementValidator, paiementIdValidator } = require('../validators/paiements.validator');

router.get('/mes-paiements', authenticate, paiementsController.getMyPaiements);
router.get('/', authenticate, authorize('admin', 'bibliothecaire'), paiementsController.getAllPaiements);
router.post('/', authenticate, createPaiementValidator, auditLog('CREATE_PAIEMENT'), paiementsController.createPaiement);
router.patch('/:id/valider', authenticate, authorize('admin'), paiementIdValidator, auditLog('VALIDER_PAIEMENT'), paiementsController.validerPaiement);

module.exports = router;