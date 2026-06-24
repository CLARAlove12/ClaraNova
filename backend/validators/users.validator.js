const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const updateProfileValidator = [
  body('nom').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('telephone').optional()
    .matches(/^[0-9+\s\-]{8,20}$/).withMessage('Numéro de téléphone invalide'),
  body('adresse').optional().trim()
    .isLength({ max: 255 }).withMessage('Adresse trop longue'),
  validate,
];

const changePasswordValidator = [
  body('ancien_mot_de_passe')
    .notEmpty().withMessage("L'ancien mot de passe est requis"),
  body('nouveau_mot_de_passe')
    .notEmpty().withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule requise')
    .matches(/[0-9]/).withMessage('Au moins un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Au moins un caractère spécial requis'),
  body('confirmation_mot_de_passe')
    .notEmpty().withMessage('La confirmation est requise')
    .custom((value, { req }) => {
      if (value !== req.body.nouveau_mot_de_passe) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),
  validate,
];

const userIdValidator = [
  param('id')
    .notEmpty().withMessage("L'ID est requis")
    .isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

const updateStatutValidator = [
  param('id')
    .notEmpty().withMessage("L'ID est requis")
    .isInt({ min: 1 }).withMessage('ID invalide'),
  body('statut')
    .notEmpty().withMessage('Le statut est requis')
    .isIn(['actif', 'inactif', 'suspendu']).withMessage('Statut invalide'),
  validate,
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  userIdValidator,
  updateStatutValidator,
};