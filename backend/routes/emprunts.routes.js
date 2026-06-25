const express = require('express');
const router = express.Router();
const empruntsController = require('../controllers/emprunts.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createEmpruntValidator, updateStatutEmpruntValidator, empruntIdValidator } = require('../validators/emprunts.validator');

router.get('/mes-emprunts', authenticate, empruntsController.getMyEmprunts);
router.get('/en-retard', authenticate, authorize('admin', 'bibliothecaire'), empruntsController.getEmpruntsEnRetard);
router.get('/', authenticate, authorize('admin', 'bibliothecaire'), empruntsController.getAllEmprunts);
router.get('/:id', authenticate, empruntIdValidator, empruntsController.getEmpruntById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createEmpruntValidator, auditLog('CREATE_EMPRUNT'), empruntsController.createEmprunt);
router.patch('/:id/statut', authenticate, authorize('admin', 'bibliothecaire'), updateStatutEmpruntValidator, auditLog('UPDATE_EMPRUNT_STATUT'), empruntsController.updateStatutEmprunt);

module.exports = router;