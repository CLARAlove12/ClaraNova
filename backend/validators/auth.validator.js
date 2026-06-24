const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const registerValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule requise')
    .matches(/[0-9]/).withMessage('Au moins un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Au moins un caractère spécial requis'),
  body('telephone').optional().matches(/^[0-9+\s\-]{8,20}$/)
    .withMessage('Numéro de téléphone invalide'),
  validate,
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est requis'),
  validate,
];

const verifyOtpValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('otp').notEmpty().withMessage("Le code OTP est requis")
    .isLength({ min: 6, max: 6 }).withMessage('Le code OTP doit contenir 6 chiffres')
    .isNumeric().withMessage('Le code OTP doit être numérique'),
  validate,
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  validate,
];

const resetPasswordValidator = [
  body('email').trim().notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage('Email invalide').normalizeEmail(),
  body('otp').notEmpty().withMessage("Le code OTP est requis")
    .isLength({ min: 6, max: 6 }).withMessage('Le code OTP doit contenir 6 chiffres')
    .isNumeric().withMessage('Le code OTP doit être numérique'),
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule requise')
    .matches(/[0-9]/).withMessage('Au moins un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Au moins un caractère spécial requis'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};