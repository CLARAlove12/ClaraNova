const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createPaiementValidator = [
  body('type').notEmpty().withMessage('Le type est requis')
    .isIn(['abonnement', 'penalite']).withMessage('Type invalide'),
  body('reference_id').notEmpty().withMessage('La référence est requise')
    .isInt({ min: 1 }).withMessage('ID référence invalide'),
  body('montant').notEmpty().withMessage('Le montant est requis')
    .isFloat({ min: 0.01 }).withMessage('Montant invalide'),
  body('moyen').notEmpty().withMessage('Le moyen de paiement est requis')
    .isIn(['Flooz', 'Mix_by_Yas']).withMessage('Moyen de paiement invalide'),
  body('reference_transaction').optional().trim()
    .isLength({ max: 100 }).withMessage('Référence transaction trop longue'),
  validate,
];

const paiementIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createPaiementValidator, paiementIdValidator };