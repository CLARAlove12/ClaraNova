const speakeasy = require('speakeasy');
const pool = require('../config/database');

const generateOtp = () => {
  return speakeasy.totp({
    secret: process.env.OTP_SECRET,
    encoding: 'base32',
    digits: 6,
    step: 600,
  });
};

const saveOtp = async (userId, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.execute(
    'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
    [otp, expiresAt, userId]
  );
};

const validateOtp = async (userId, otp) => {
  const [rows] = await pool.execute(
    'SELECT otp_code, otp_expires_at FROM users WHERE id = ?',
    [userId]
  );

  const user = rows[0];
  if (!user || !user.otp_code || !user.otp_expires_at) return false;
  if (new Date() > new Date(user.otp_expires_at)) return false;
  if (user.otp_code !== otp) return false;

  await pool.execute(
    'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
    [userId]
  );

  return true;
};

module.exports = { generateOtp, saveOtp, validateOtp };