const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createCategorieValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description').optional().trim()
    .isLength({ max: 1000 }).withMessage('La description ne doit pas dépasser 1000 caractères'),
  validate,
];

const updateCategorieValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('nom').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description').optional().trim()
    .isLength({ max: 1000 }).withMessage('La description ne doit pas dépasser 1000 caractères'),
  validate,
];

const categorieIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createCategorieValidator, updateCategorieValidator, categorieIdValidator };