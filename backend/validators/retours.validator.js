const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createRetourValidator = [
  body('emprunt_id').notEmpty().withMessage('L\'emprunt est requis')
    .isInt({ min: 1 }).withMessage('ID emprunt invalide'),
  body('etat_livre').notEmpty().withMessage('L\'état du livre est requis')
    .isIn(['bon_etat', 'degrade', 'dechire', 'sale', 'perdu']).withMessage('État invalide'),
  body('observations').optional().trim()
    .isLength({ max: 1000 }).withMessage('Observations trop longues'),
  validate,
];

const retourIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createRetourValidator, retourIdValidator };