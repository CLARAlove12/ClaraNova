const pool = require('../config/database');

const getAllReservations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              l.titre AS livre_titre, l.isbn, l.image AS livre_image,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN livres l ON r.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       ORDER BY r.date_reservation DESC`
    );
    return res.status(200).json({ success: true, message: 'Réservations récupérées', data: rows });
  } catch (error) {
    console.error('getAllReservations error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
              l.titre AS livre_titre, l.isbn, l.image AS livre_image,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM reservations r
       JOIN livres l ON r.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       WHERE r.user_id = ?
       ORDER BY r.date_reservation DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Mes réservations', data: rows });
  } catch (error) {
    console.error('getMyReservations error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createReservation = async (req, res) => {
  try {
    const { livre_id } = req.body;
    const user_id = req.user.id;

    const [abonnement] = await pool.execute(
      'SELECT id FROM abonnements WHERE user_id = ? AND statut = "actif" AND date_fin >= CURDATE()',
      [user_id]
    );
    if (abonnement.length === 0) {
      return res.status(403).json({ success: false, message: 'Vous n\'avez pas d\'abonnement actif' });
    }

    const [livre] = await pool.execute('SELECT id, titre, statut FROM livres WHERE id = ?', [livre_id]);
    if (livre.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }
    if (livre[0].statut === 'disponible') {
      return res.status(409).json({ success: false, message: 'Ce livre est disponible, empruntez-le directement' });
    }

    const [reservationExistante] = await pool.execute(
      'SELECT id FROM reservations WHERE user_id = ? AND livre_id = ? AND statut = "en_attente"',
      [user_id, livre_id]
    );
    if (reservationExistante.length > 0) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà une réservation en attente pour ce livre' });
    }

    const [parametres] = await pool.execute(
      'SELECT valeur FROM parametres WHERE cle = "duree_reservation_jours"'
    );
    const dureeReservation = parseInt(parametres[0]?.valeur, 10) || 3;

    const [result] = await pool.execute(
      'INSERT INTO reservations (user_id, livre_id) VALUES (?, ?)',
      [user_id, livre_id]
    );

    const [newReservation] = await pool.execute(
      `SELECT r.*, l.titre AS livre_titre FROM reservations r
       JOIN livres l ON r.livre_id = l.id WHERE r.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: `Réservation créée. Valable ${dureeReservation} jours.`,
      data: newReservation[0],
    });
  } catch (error) {
    console.error('createReservation error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateStatutReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const [existing] = await pool.execute('SELECT id FROM reservations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    await pool.execute('UPDATE reservations SET statut = ? WHERE id = ?', [statut, id]);

    return res.status(200).json({ success: true, message: 'Statut réservation mis à jour' });
  } catch (error) {
    console.error('updateStatutReservation error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const annulerReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }
    if (existing[0].statut !== 'en_attente') {
      return res.status(409).json({ success: false, message: 'Seules les réservations en attente peuvent être annulées' });
    }

    await pool.execute('UPDATE reservations SET statut = "annulee" WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Réservation annulée avec succès' });
  } catch (error) {
    console.error('annulerReservation error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllReservations, getMyReservations, createReservation, updateStatutReservation, annulerReservation };