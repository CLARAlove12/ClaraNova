const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createAuteurValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('nationalite').optional().trim()
    .isLength({ max: 100 }).withMessage('La nationalité ne doit pas dépasser 100 caractères'),
  body('biographie').optional().trim()
    .isLength({ max: 5000 }).withMessage('La biographie ne doit pas dépasser 5000 caractères'),
  validate,
];

const updateAuteurValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('nom').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('nationalite').optional().trim()
    .isLength({ max: 100 }).withMessage('La nationalité ne doit pas dépasser 100 caractères'),
  body('biographie').optional().trim()
    .isLength({ max: 5000 }).withMessage('La biographie ne doit pas dépasser 5000 caractères'),
  validate,
];

const auteurIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createAuteurValidator, updateAuteurValidator, auteurIdValidator };