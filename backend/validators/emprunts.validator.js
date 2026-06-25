const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createEmpruntValidator = [
  body('user_id').notEmpty().withMessage('L\'utilisateur est requis')
    .isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  body('exemplaire_id').notEmpty().withMessage('L\'exemplaire est requis')
    .isInt({ min: 1 }).withMessage('ID exemplaire invalide'),
  body('date_retour_prevue').optional()
    .isDate().withMessage('Date de retour invalide (format: YYYY-MM-DD)')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date de retour prévue doit être dans le futur');
      }
      return true;
    }),
  validate,
];

const updateStatutEmpruntValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('statut').notEmpty().withMessage('Le statut est requis')
    .isIn(['en_cours', 'retourne', 'en_retard', 'perdu']).withMessage('Statut invalide'),
  validate,
];

const empruntIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createEmpruntValidator, updateStatutEmpruntValidator, empruntIdValidator };