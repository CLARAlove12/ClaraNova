const pool = require('../config/database');

const creerNotification = async ({ user_id, expediteur_id = null, titre, message, type }) => {
  try {
    await pool.execute(
      `INSERT INTO notifications (user_id, expediteur_id, titre, message, type)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, expediteur_id, titre, message, type]
    );
  } catch (error) {
    console.error('creerNotification error:', error.message);
  }
};

const notifierEmpruntCreee = async (user_id, livre_titre) => {
  await creerNotification({
    user_id,
    titre: 'Emprunt enregistré',
    message: `Votre emprunt du livre "${livre_titre}" a été enregistré. Retour prévu sous 14 jours.`,
    type: 'emprunt',
  });
};

const notifierRetourEnregistre = async (user_id, livre_titre) => {
  await creerNotification({
    user_id,
    titre: 'Retour enregistré',
    message: `Le retour du livre "${livre_titre}" a bien été enregistré. Merci !`,
    type: 'retour',
  });
};

const notifierPenaliteCreee = async (user_id, motif, montant) => {
  await creerNotification({
    user_id,
    titre: 'Pénalité appliquée',
    message: `Une pénalité de ${montant} FCFA a été appliquée pour motif : ${motif}.`,
    type: 'penalite',
  });
};

const notifierAbonnementExpireBientot = async (user_id, date_fin) => {
  await creerNotification({
    user_id,
    titre: 'Abonnement bientôt expiré',
    message: `Votre abonnement expire le ${date_fin}. Pensez à le renouveler.`,
    type: 'abonnement',
  });
};

const notifierReservationConfirmee = async (user_id, livre_titre) => {
  await creerNotification({
    user_id,
    titre: 'Réservation confirmée',
    message: `Votre réservation pour le livre "${livre_titre}" est confirmée.`,
    type: 'reservation',
  });
};

const notifierEmpruntEnRetard = async (user_id, livre_titre, jours_retard) => {
  await creerNotification({
    user_id,
    titre: 'Retard de retour',
    message: `Le livre "${livre_titre}" est en retard de ${jours_retard} jour(s). Merci de le retourner rapidement.`,
    type: 'retard',
  });
};

module.exports = {
  creerNotification,
  notifierEmpruntCreee,
  notifierRetourEnregistre,
  notifierPenaliteCreee,
  notifierAbonnementExpireBientot,
  notifierReservationConfirmee,
  notifierEmpruntEnRetard,
};