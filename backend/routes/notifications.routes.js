const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const sendNotificationValidator = [
  body('user_id').notEmpty().isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('message').trim().notEmpty().withMessage('Le message est requis'),
  body('type').trim().notEmpty().withMessage('Le type est requis'),
  validate,
];

router.get('/', authenticate, notificationsController.getMyNotifications);
router.patch('/:id/lire', authenticate, notificationsController.marquerLue);
router.patch('/lire-toutes', authenticate, notificationsController.marquerToutesLues);
router.post('/envoyer', authenticate, authorize('admin', 'bibliothecaire'), sendNotificationValidator, notificationsController.sendNotification);
router.delete('/:id', authenticate, notificationsController.deleteNotification);

module.exports = router;