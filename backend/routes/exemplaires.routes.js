const express = require('express');
const router = express.Router();
const exemplairesController = require('../controllers/exemplaires.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createExemplaireValidator, updateExemplaireValidator, exemplaireIdValidator } = require('../validators/exemplaires.validator');

router.get('/', authenticate, authorize('admin', 'bibliothecaire'), exemplairesController.getAllExemplaires);
router.get('/livre/:livreId', authenticate, exemplairesController.getExemplairesByLivre);
router.get('/:id', authenticate, authorize('admin', 'bibliothecaire'), exemplaireIdValidator, exemplairesController.getExemplaireById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createExemplaireValidator, auditLog('CREATE_EXEMPLAIRE'), exemplairesController.createExemplaire);
router.put('/:id', authenticate, authorize('admin', 'bibliothecaire'), updateExemplaireValidator, auditLog('UPDATE_EXEMPLAIRE'), exemplairesController.updateExemplaire);
router.delete('/:id', authenticate, authorize('admin'), exemplaireIdValidator, auditLog('DELETE_EXEMPLAIRE'), exemplairesController.deleteExemplaire);

module.exports = router;