const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createExemplaireValidator = [
  body('livre_id').notEmpty().withMessage('Le livre est requis')
    .isInt({ min: 1 }).withMessage('ID livre invalide'),
  body('code_barre').trim().notEmpty().withMessage('Le code barre est requis')
    .isLength({ min: 3, max: 100 }).withMessage('Code barre invalide'),
  body('etat').optional()
    .isIn(['neuf', 'bon_etat', 'use', 'endommage', 'perdu'])
    .withMessage('État invalide'),
  validate,
];

const updateExemplaireValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('etat').optional()
    .isIn(['neuf', 'bon_etat', 'use', 'endommage', 'perdu'])
    .withMessage('État invalide'),
  body('disponible').optional()
    .isBoolean().withMessage('Disponible doit être un booléen'),
  validate,
];

const exemplaireIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createExemplaireValidator, updateExemplaireValidator, exemplaireIdValidator };