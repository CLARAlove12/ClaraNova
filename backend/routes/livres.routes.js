const express = require('express');
const router = express.Router();
const livresController = require('../controllers/livres.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  createLivreValidator,
  updateLivreValidator,
  livreIdValidator,
  searchLivreValidator,
} = require('../validators/livres.validator');

router.get('/', authenticate, searchLivreValidator, livresController.getAllLivres);
router.get('/:id', authenticate, livreIdValidator, livresController.getLivreById);
router.post('/', authenticate, authorize('admin', 'bibliothecaire'), createLivreValidator, auditLog('CREATE_LIVRE'), livresController.createLivre);
router.put('/:id', authenticate, authorize('admin', 'bibliothecaire'), updateLivreValidator, auditLog('UPDATE_LIVRE'), livresController.updateLivre);
router.post('/:id/image', authenticate, authorize('admin', 'bibliothecaire'), livreIdValidator, auditLog('UPLOAD_IMAGE_LIVRE'), livresController.uploadImageLivre);
router.delete('/:id', authenticate, authorize('admin'), livreIdValidator, auditLog('DELETE_LIVRE'), livresController.deleteLivre);

module.exports = router;