const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { generateOtp, saveOtp, validateOtp } = require('../services/otp.service');
const {
  sendOtpVerificationEmail,
  sendOtpResetPasswordEmail,
  sendWelcomeEmail,
} = require('../services/email.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);

    const [result] = await pool.execute(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, telephone, role_id, statut, email_verifie)
       VALUES (?, ?, ?, ?, ?, 3, 'inactif', 0)`,
      [nom, prenom, email, hashedPassword, telephone || null]
    );

    const otp = generateOtp();
    await saveOtp(result.insertId, otp);
    await sendOtpVerificationEmail(email, prenom, otp);

    return res.status(201).json({
      success: true,
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      data: { id: result.insertId, email },
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, prenom, statut FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const user = rows[0];
    const isValid = await validateOtp(user.id, otp);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Code OTP invalide ou expiré' });
    }

    await pool.execute(
      "UPDATE users SET email_verifie = 1, statut = 'actif' WHERE id = ?",
      [user.id]
    );

    await sendWelcomeEmail(email, user.prenom);

    return res.status(200).json({
      success: true,
      message: 'Compte activé avec succès. Vous pouvez vous connecter.',
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    const [rows] = await pool.execute(
      `SELECT u.*, r.nom AS role_nom 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    if (user.bloque_jusqu_a && new Date() < new Date(user.bloque_jusqu_a)) {
      return res.status(423).json({
        success: false,
        message: `Compte bloqué jusqu'au ${new Date(user.bloque_jusqu_a).toLocaleString('fr-FR')}`,
      });
    }

    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isPasswordValid) {
      const tentatives = user.tentatives_connexion + 1;
      if (tentatives >= 5) {
        const bloqueJusqua = new Date(Date.now() + 30 * 60 * 1000);
        await pool.execute(
          'UPDATE users SET tentatives_connexion = ?, bloque_jusqu_a = ? WHERE id = ?',
          [tentatives, bloqueJusqua, user.id]
        );
        return res.status(423).json({
          success: false,
          message: 'Compte bloqué 30 minutes après 5 tentatives échouées',
        });
      }
      await pool.execute(
        'UPDATE users SET tentatives_connexion = ? WHERE id = ?',
        [tentatives, user.id]
      );
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    if (user.statut === 'inactif') {
      return res.status(403).json({
        success: false,
        message: 'Compte non activé. Vérifiez votre email.',
      });
    }

    if (user.statut === 'suspendu') {
      return res.status(403).json({
        success: false,
        message: 'Compte suspendu. Contactez l\'administration.',
      });
    }

    await pool.execute(
      'UPDATE users SET tentatives_connexion = 0, bloque_jusqu_a = NULL WHERE id = ?',
      [user.id]
    );

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_nom,
      role_id: user.role_id,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        accessToken,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role_nom,
          photo: user.photo,
        },
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

    const [rows] = await pool.execute(
      `SELECT u.*, r.nom AS role_nom 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [decoded.id]
    );

    const user = rows[0];
    if (!user || user.statut !== 'actif') {
      return res.status(401).json({ success: false, message: 'Utilisateur invalide' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_nom,
      role_id: user.role_id,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Token renouvelé',
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error('refreshToken error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const logout = async (req, res) => {
  try {
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

    const [rows] = await pool.execute(
      'SELECT id, prenom, statut FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0 || rows[0].statut === 'inactif') {
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un code a été envoyé.',
      });
    }

    const user = rows[0];
    const otp = generateOtp();
    await saveOtp(user.id, otp);
    await sendOtpResetPasswordEmail(email, user.prenom, otp);

    return res.status(200).json({
      success: true,
      message: 'Si cet email existe, un code a été envoyé.',
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, mot_de_passe } = req.body;

    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const user = rows[0];
    const isValid = await validateOtp(user.id, otp);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Code OTP invalide ou expiré' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);

    await pool.execute(
      'UPDATE users SET mot_de_passe = ?, tentatives_connexion = 0, bloque_jusqu_a = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès.',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword };