const pool = require('../config/database');

const getAllPenalites = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              l.titre AS livre_titre, ex.code_barre,
              e.date_emprunt, e.date_retour_prevue,
              r.date_retour_reelle
       FROM penalites p
       JOIN users u ON p.user_id = u.id
       JOIN retours r ON p.retour_id = r.id
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       ORDER BY p.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Pénalités récupérées', data: rows });
  } catch (error) {
    console.error('getAllPenalites error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyPenalites = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*,
              l.titre AS livre_titre, ex.code_barre,
              e.date_emprunt, r.date_retour_reelle
       FROM penalites p
       JOIN retours r ON p.retour_id = r.id
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    const total_impayees = rows.filter(p => p.statut === 'impayee').reduce((sum, p) => sum + parseFloat(p.montant), 0);
    return res.status(200).json({
      success: true,
      message: 'Mes pénalités',
      data: { penalites: rows, total_impayees },
    });
  } catch (error) {
    console.error('getMyPenalites error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getPenaliteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.*, u.nom AS user_nom, u.prenom AS user_prenom,
              l.titre AS livre_titre
       FROM penalites p
       JOIN users u ON p.user_id = u.id
       JOIN retours r ON p.retour_id = r.id
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pénalité introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Pénalité récupérée', data: rows[0] });
  } catch (error) {
    console.error('getPenaliteById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const marquerPenalitePayee = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM penalites WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pénalité introuvable' });
    }
    if (existing[0].statut === 'payee') {
      return res.status(409).json({ success: false, message: 'Cette pénalité est déjà payée' });
    }

    await pool.execute('UPDATE penalites SET statut = "payee" WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Pénalité marquée comme payée' });
  } catch (error) {
    console.error('marquerPenalitePayee error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllPenalites, getMyPenalites, getPenaliteById, marquerPenalitePayee };