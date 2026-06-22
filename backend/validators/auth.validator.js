const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule requise')
    .matches(/[0-9]/).withMessage('Au moins un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Au moins un caractère spécial requis'),
  validate,
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  validate,
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  validate,
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Le token est requis'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule requise')
    .matches(/[0-9]/).withMessage('Au moins un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Au moins un caractère spécial requis'),
  validate,
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator };