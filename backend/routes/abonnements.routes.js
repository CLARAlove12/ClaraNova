const express = require('express');
const router = express.Router();
const abonnementsController = require('../controllers/abonnements.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createAbonnementValidator, updateStatutAbonnementValidator, abonnementIdValidator } = require('../validators/abonnements.validator');

router.get('/mes-abonnements', authenticate, abonnementsController.getMyAbonnements);
router.get('/verifier', authenticate, abonnementsController.verifierAbonnementActif);
router.get('/', authenticate, authorize('admin', 'bibliothecaire'), abonnementsController.getAllAbonnements);
router.get('/:id', authenticate, authorize('admin', 'bibliothecaire'), abonnementIdValidator, abonnementsController.getAbonnementById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createAbonnementValidator, auditLog('CREATE_ABONNEMENT'), abonnementsController.createAbonnement);
router.patch('/:id/statut', authenticate, authorize('admin'), updateStatutAbonnementValidator, auditLog('UPDATE_ABONNEMENT_STATUT'), abonnementsController.updateStatutAbonnement);

module.exports = router;