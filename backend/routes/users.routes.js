const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  updateProfileValidator,
  changePasswordValidator,
  userIdValidator,
  updateStatutValidator,
} = require('../validators/users.validator');

router.get('/me', authenticate, usersController.getMyProfile);
router.put('/me', authenticate, updateProfileValidator, auditLog('UPDATE_PROFILE'), usersController.updateProfile);
router.post('/me/photo', authenticate, auditLog('UPDATE_PHOTO'), usersController.uploadPhoto);
router.put('/me/password', authenticate, changePasswordValidator, auditLog('CHANGE_PASSWORD'), usersController.changePassword);

router.get('/', authenticate, authorize('admin'), usersController.getAllUsers);
router.get('/:id', authenticate, authorize('admin', 'bibliothecaire'), userIdValidator, usersController.getUserById);
router.patch('/:id/statut', authenticate, authorize('admin'), updateStatutValidator, auditLog('UPDATE_STATUT'), usersController.updateStatut);
router.delete('/:id', authenticate, authorize('admin'), userIdValidator, auditLog('DELETE_USER'), usersController.deleteUser);

module.exports = router;