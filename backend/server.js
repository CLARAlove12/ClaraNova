const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

require('./config/database');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CNova API opérationnelle' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur CNova démarré sur le port ${PORT} [${process.env.NODE_ENV}]`);
});

const usersRoutes = require('./routes/users.routes');
app.use('/api/users', usersRoutes);

const auteursRoutes = require('./routes/auteurs.routes');
const categoriesRoutes = require('./routes/categories.routes');
const livresRoutes = require('./routes/livres.routes');
const exemplairesRoutes = require('./routes/exemplaires.routes');

app.use('/api/auteurs', auteursRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/livres', livresRoutes);
app.use('/api/exemplaires', exemplairesRoutes);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();
require('./config/database');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const auteursRoutes = require('./routes/auteurs.routes');
const categoriesRoutes = require('./routes/categories.routes');
const livresRoutes = require('./routes/livres.routes');
const exemplairesRoutes = require('./routes/exemplaires.routes');
const abonnementsRoutes = require('./routes/abonnements.routes');
const empruntsRoutes = require('./routes/emprunts.routes');
const retoursRoutes = require('./routes/retours.routes');
const reservationsRoutes = require('./routes/reservations.routes');
const penalitesRoutes = require('./routes/penalites.routes');
const paiementsRoutes = require('./routes/paiements.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const messagesRoutes = require('./routes/messages.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const auditRoutes = require('./routes/audit.routes');
const rapportsRoutes = require('./routes/rapports.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auteurs', auteursRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/livres', livresRoutes);
app.use('/api/exemplaires', exemplairesRoutes);
app.use('/api/abonnements', abonnementsRoutes);
app.use('/api/emprunts', empruntsRoutes);
app.use('/api/retours', retoursRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/penalites', penalitesRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/rapports', rapportsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CNova API opérationnelle' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur CNova démarré sur le port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;

module.exports = app;