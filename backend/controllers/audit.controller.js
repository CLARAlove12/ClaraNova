const pool = require('../config/database');

const getAuditLogs = async (req, res) => {
  try {
    const { action, user_id, date_debut, date_fin } = req.query;

    let query = `
      SELECT al.*, u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;

    const conditions = [];
    const values = [];

    if (action) { conditions.push('al.action LIKE ?'); values.push(`%${action}%`); }
    if (user_id) { conditions.push('al.user_id = ?'); values.push(user_id); }
    if (date_debut) { conditions.push('DATE(al.created_at) >= ?'); values.push(date_debut); }
    if (date_fin) { conditions.push('DATE(al.created_at) <= ?'); values.push(date_fin); }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.created_at DESC LIMIT 500';

    const [rows] = await pool.execute(query, values);
    return res.status(200).json({ success: true, message: 'Logs d\'audit récupérés', data: rows });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyAuditLogs = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Mon historique', data: rows });
  } catch (error) {
    console.error('getMyAuditLogs error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAuditLogs, getMyAuditLogs };