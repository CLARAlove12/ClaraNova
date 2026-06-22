const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de créations de compte. Réessayez dans 1 heure.' },
});

router.post('/register', registerLimiter, registerValidator, auditLog('REGISTER'), authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authLimiter, loginValidator, auditLog('LOGIN'), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, auditLog('LOGOUT'), authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);

module.exports = router;