const pool = require('../config/database');

const getMyNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.*,
              u.nom AS expediteur_nom, u.prenom AS expediteur_prenom
       FROM notifications n
       LEFT JOIN users u ON n.expediteur_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    const non_lues = rows.filter(n => !n.lu).length;
    return res.status(200).json({
      success: true,
      message: 'Notifications récupérées',
      data: { notifications: rows, non_lues },
    });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const marquerLue = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification introuvable' });
    }
    await pool.execute('UPDATE notifications SET lu = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('marquerLue error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const marquerToutesLues = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET lu = 1 WHERE user_id = ? AND lu = 0',
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('marquerToutesLues error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { user_id, titre, message, type } = req.body;
    const expediteur_id = req.user.id;

    const [user] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur destinataire introuvable' });
    }

    await pool.execute(
      `INSERT INTO notifications (user_id, expediteur_id, titre, message, type)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, expediteur_id, titre, message, type]
    );

    return res.status(201).json({ success: true, message: 'Notification envoyée avec succès' });
  } catch (error) {
    console.error('sendNotification error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification introuvable' });
    }
    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getMyNotifications, marquerLue, marquerToutesLues, sendNotification, deleteNotification };