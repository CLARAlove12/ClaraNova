const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservations.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createReservationValidator, updateStatutReservationValidator, reservationIdValidator } = require('../validators/reservations.validator');

router.get('/mes-reservations', authenticate, reservationsController.getMyReservations);
router.get('/', authenticate, authorize('admin', 'bibliothecaire'), reservationsController.getAllReservations);
router.post('/', authenticate, createReservationValidator, auditLog('CREATE_RESERVATION'), reservationsController.createReservation);
router.patch('/:id/statut', authenticate, authorize('admin', 'bibliothecaire'), updateStatutReservationValidator, auditLog('UPDATE_RESERVATION_STATUT'), reservationsController.updateStatutReservation);
router.patch('/:id/annuler', authenticate, reservationIdValidator, auditLog('ANNULER_RESERVATION'), reservationsController.annulerReservation);

module.exports = router;