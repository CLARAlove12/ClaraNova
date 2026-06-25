const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createLivreValidator = [
  body('titre').trim().notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 1, max: 255 }).withMessage('Le titre ne doit pas dépasser 255 caractères'),
  body('isbn').optional().trim()
    .isLength({ max: 50 }).withMessage('ISBN trop long'),
  body('resume').optional().trim()
    .isLength({ max: 10000 }).withMessage('Le résumé est trop long'),
  body('auteur_id').optional()
    .isInt({ min: 1 }).withMessage('ID auteur invalide'),
  body('categorie_id').optional()
    .isInt({ min: 1 }).withMessage('ID catégorie invalide'),
  body('date_publication').optional()
    .isDate().withMessage('Date de publication invalide (format: YYYY-MM-DD)'),
  body('nb_exemplaires').optional()
    .isInt({ min: 0 }).withMessage('Le nombre d\'exemplaires doit être un entier positif'),
  body('prix').optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  validate,
];

const updateLivreValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('titre').optional().trim()
    .isLength({ min: 1, max: 255 }).withMessage('Le titre ne doit pas dépasser 255 caractères'),
  body('isbn').optional().trim()
    .isLength({ max: 50 }).withMessage('ISBN trop long'),
  body('resume').optional().trim()
    .isLength({ max: 10000 }).withMessage('Le résumé est trop long'),
  body('auteur_id').optional()
    .isInt({ min: 1 }).withMessage('ID auteur invalide'),
  body('categorie_id').optional()
    .isInt({ min: 1 }).withMessage('ID catégorie invalide'),
  body('date_publication').optional()
    .isDate().withMessage('Date de publication invalide (format: YYYY-MM-DD)'),
  body('nb_exemplaires').optional()
    .isInt({ min: 0 }).withMessage('Le nombre d\'exemplaires doit être un entier positif'),
  body('prix').optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('statut').optional()
    .isIn(['disponible', 'emprunte', 'reserve', 'perdu', 'indisponible'])
    .withMessage('Statut invalide'),
  validate,
];

const livreIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

const searchLivreValidator = [
  query('q').optional().trim().isLength({ min: 1 }).withMessage('Terme de recherche invalide'),
  query('categorie_id').optional().isInt({ min: 1 }).withMessage('ID catégorie invalide'),
  query('auteur_id').optional().isInt({ min: 1 }).withMessage('ID auteur invalide'),
  query('statut').optional()
    .isIn(['disponible', 'emprunte', 'reserve', 'perdu', 'indisponible'])
    .withMessage('Statut invalide'),
  validate,
];

module.exports = { createLivreValidator, updateLivreValidator, livreIdValidator, searchLivreValidator };