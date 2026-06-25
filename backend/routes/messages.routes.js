const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const sendMessageValidator = [
  body('destinataire_id').notEmpty().isInt({ min: 1 }).withMessage('Destinataire invalide'),
  body('titre').trim().notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 255 }).withMessage('Titre trop long'),
  body('contenu').trim().notEmpty().withMessage('Le contenu est requis'),
  body('type').notEmpty()
    .isIn(['lecteur_vers_admin', 'admin_vers_bibliothecaire', 'bibliothecaire_vers_lecteur'])
    .withMessage('Type de message invalide'),
  validate,
];

router.get('/', authenticate, messagesController.getMyMessages);
router.get('/:id', authenticate, messagesController.getMessageById);
router.post('/', authenticate, sendMessageValidator, messagesController.sendMessage);

module.exports = router;