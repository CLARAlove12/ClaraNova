const transporter = require('../config/mailer');

const sendOtpVerificationEmail = async (to, prenom, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Activation de votre compte',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#4F46E5;">Bienvenue sur CNova </h2>
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>Votre code d'activation est :</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                    color:#4F46E5;text-align:center;padding:16px;
                    background:#F3F4F6;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p>Ce code est valable <strong>10 minutes</strong>.</p>
        <p style="font-size:12px;color:#999;">
          Si vous n'avez pas créé de compte CNova, ignorez cet email.
        </p>
      </div>
    `,
  });
};

const sendOtpResetPasswordEmail = async (to, prenom, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Réinitialisation de mot de passe',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#DC2626;">Réinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>Votre code de réinitialisation est :</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                    color:#DC2626;text-align:center;padding:16px;
                    background:#FEF2F2;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p>Ce code est valable <strong>10 minutes</strong>.</p>
        <p style="font-size:12px;color:#999;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    `,
  });
};

const sendWelcomeEmail = async (to, prenom) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Votre compte est activé ',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#16A34A;">Bonjour ${prenom} </h2>
        <p>Votre compte CNova est maintenant activé.</p>
        <p>Vous pouvez vous connecter et commencer à emprunter des livres.</p>
        <a href="${process.env.CLIENT_URL}/login"
           style="display:inline-block;margin:16px 0;padding:12px 28px;
                  background:#16A34A;color:#fff;text-decoration:none;
                  border-radius:6px;font-weight:bold;">
          Se connecter
        </a>
      </div>
    `,
  });
};

module.exports = { sendOtpVerificationEmail, sendOtpResetPasswordEmail, sendWelcomeEmail };