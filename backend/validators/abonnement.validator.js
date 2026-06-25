const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createAbonnementValidator = [
  body('user_id').notEmpty().withMessage('L\'utilisateur est requis')
    .isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  body('date_debut').notEmpty().withMessage('La date de début est requise')
    .isDate().withMessage('Date de début invalide (format: YYYY-MM-DD)'),
  body('date_fin').notEmpty().withMessage('La date de fin est requise')
    .isDate().withMessage('Date de fin invalide (format: YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.date_debut)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
      return true;
    }),
  body('montant').optional()
    .isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),
  validate,
];

const updateStatutAbonnementValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('statut').notEmpty().withMessage('Le statut est requis')
    .isIn(['actif', 'expire', 'annule']).withMessage('Statut invalide'),
  validate,
];

const abonnementIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createAbonnementValidator, updateStatutAbonnementValidator, abonnementIdValidator };