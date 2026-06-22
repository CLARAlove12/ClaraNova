const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password, email_verify_token, email_verify_expires)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, emailVerifyToken, emailVerifyExpires]
    );

    await sendVerificationEmail(email, emailVerifyToken);

    return res.status(201).json({
      success: true,
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      data: { id: result.insertId, email, firstName, lastName },
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token manquant' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email_verify_token = ? AND email_verify_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    const user = rows[0];

    await pool.execute(
      `UPDATE users SET is_email_verified = TRUE, email_verify_token = NULL, email_verify_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    await sendWelcomeEmail(user.email, user.first_name);

    return res.status(200).json({ success: true, message: 'Email vérifié. Vous pouvez vous connecter.' });
  } catch (error) {
    console.error('verifyEmail error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Veuillez vérifier votre adresse email avant de vous connecter',
      });
    }

    const payload = { id: user.id, role: user.role, email: user.email };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await pool.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [hashedRefreshToken, user.id]);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        accessToken,
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      },
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user || !user.refresh_token) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    const isValid = await bcrypt.compare(token, user.refresh_token);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    const payload = { id: user.id, role: user.role, email: user.email };

    const newAccessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await pool.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [hashedRefreshToken, user.id]);

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({ success: true, message: 'Token renouvelé', data: { accessToken: newAccessToken } });
  } catch (error) {
    console.error('refreshToken error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const logout = async (req, res) => {
  try {
    await pool.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(200).json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('logout error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: 'Si cet email existe, un lien a été envoyé.' });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({ success: true, message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    const user = rows[0];
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);

    await pool.execute(
      `UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL,
       refresh_token = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword };