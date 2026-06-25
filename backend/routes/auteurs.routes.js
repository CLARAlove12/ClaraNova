const express = require('express');
const router = express.Router();
const auteursController = require('../controllers/auteurs.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createAuteurValidator, updateAuteurValidator, auteurIdValidator } = require('../validators/auteurs.validator');

router.get('/', authenticate, auteursController.getAllAuteurs);
router.get('/:id', authenticate, auteurIdValidator, auteursController.getAuteurById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createAuteurValidator, auditLog('CREATE_AUTEUR'), auteursController.createAuteur);
router.put('/:id', authenticate, authorize('admin', 'bibliothecaire'), updateAuteurValidator, auditLog('UPDATE_AUTEUR'), auteursController.updateAuteur);
router.delete('/:id', authenticate, authorize('admin'), auteurIdValidator, auditLog('DELETE_AUTEUR'), auteursController.deleteAuteur);

module.exports = router;