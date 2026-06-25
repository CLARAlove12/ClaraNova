const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createReservationValidator = [
  body('livre_id').notEmpty().withMessage('Le livre est requis')
    .isInt({ min: 1 }).withMessage('ID livre invalide'),
  validate,
];

const updateStatutReservationValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  body('statut').notEmpty().withMessage('Le statut est requis')
    .isIn(['en_attente', 'confirmee', 'annulee', 'expiree']).withMessage('Statut invalide'),
  validate,
];

const reservationIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  validate,
];

module.exports = { createReservationValidator, updateStatutReservationValidator, reservationIdValidator };