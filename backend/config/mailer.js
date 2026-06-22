const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Connexion SMTP échouée :', error.message);
  } else {
    console.log('✅ Serveur SMTP prêt');
  }
});

module.exports = transporter;