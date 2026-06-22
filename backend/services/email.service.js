const transporter = require('../config/mailer');

const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Vérifiez votre adresse email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#4F46E5;">Bienvenue sur CNova 📚</h2>
        <p>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
        <p>Ce lien est valable <strong>24 heures</strong>.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 28px;
                  background:#4F46E5;color:#fff;text-decoration:none;
                  border-radius:6px;font-weight:bold;">
          Activer mon compte
        </a>
        <p style="font-size:12px;color:#999;">
          Si vous n'avez pas créé de compte CNova, ignorez cet email.
        </p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Réinitialisation de mot de passe',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#DC2626;">Réinitialisation de mot de passe</h2>
        <p>Une demande de réinitialisation a été effectuée pour votre compte.</p>
        <p>Ce lien est valable <strong>1 heure</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 28px;
                  background:#DC2626;color:#fff;text-decoration:none;
                  border-radius:6px;font-weight:bold;">
          Réinitialiser mon mot de passe
        </a>
        <p style="font-size:12px;color:#999;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    `,
  });
};

const sendWelcomeEmail = async (to, firstName) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CNova <no-reply@cnova.com>',
    to,
    subject: 'CNova — Votre compte est activé 🎉',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#16A34A;">Bonjour ${firstName} 👋</h2>
        <p>Votre compte CNova est maintenant activé. Vous pouvez vous connecter dès maintenant.</p>
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

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };