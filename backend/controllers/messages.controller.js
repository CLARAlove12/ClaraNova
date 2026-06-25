const pool = require('../config/database');

const getMyMessages = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*,
              e.nom AS expediteur_nom, e.prenom AS expediteur_prenom,
              d.nom AS destinataire_nom, d.prenom AS destinataire_prenom
       FROM messages m
       JOIN users e ON m.expediteur_id = e.id
       JOIN users d ON m.destinataire_id = d.id
       WHERE m.expediteur_id = ? OR m.destinataire_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.id, req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Messages récupérés', data: rows });
  } catch (error) {
    console.error('getMyMessages error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT m.*,
              e.nom AS expediteur_nom, e.prenom AS expediteur_prenom,
              d.nom AS destinataire_nom, d.prenom AS destinataire_prenom
       FROM messages m
       JOIN users e ON m.expediteur_id = e.id
       JOIN users d ON m.destinataire_id = d.id
       WHERE m.id = ? AND (m.expediteur_id = ? OR m.destinataire_id = ?)`,
      [id, req.user.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message introuvable' });
    }
    if (!rows[0].lu && rows[0].destinataire_id === req.user.id) {
      await pool.execute('UPDATE messages SET lu = 1 WHERE id = ?', [id]);
    }
    return res.status(200).json({ success: true, message: 'Message récupéré', data: rows[0] });
  } catch (error) {
    console.error('getMessageById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { destinataire_id, titre, contenu, type } = req.body;
    const expediteur_id = req.user.id;

    const [destinataire] = await pool.execute('SELECT id FROM users WHERE id = ?', [destinataire_id]);
    if (destinataire.length === 0) {
      return res.status(404).json({ success: false, message: 'Destinataire introuvable' });
    }

    const [result] = await pool.execute(
      `INSERT INTO messages (expediteur_id, destinataire_id, titre, contenu, type)
       VALUES (?, ?, ?, ?, ?)`,
      [expediteur_id, destinataire_id, titre, contenu, type]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, expediteur_id, titre, message, type)
       VALUES (?, ?, ?, ?, 'message')`,
      [destinataire_id, expediteur_id, `Nouveau message : ${titre}`, `Vous avez reçu un message de la part de ${req.user.email}`]
    );

    return res.status(201).json({ success: true, message: 'Message envoyé avec succès', data: { id: result.insertId } });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getMyMessages, getMessageById, sendMessage };