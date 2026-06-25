const pool = require('../config/database');

const getAllAbonnements = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, u.nom, u.prenom, u.email
       FROM abonnements a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Abonnements récupérés', data: rows });
  } catch (error) {
    console.error('getAllAbonnements error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyAbonnements = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM abonnements WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Mes abonnements', data: rows });
  } catch (error) {
    console.error('getMyAbonnements error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getAbonnementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT a.*, u.nom, u.prenom, u.email
       FROM abonnements a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Abonnement introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Abonnement récupéré', data: rows[0] });
  } catch (error) {
    console.error('getAbonnementById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createAbonnement = async (req, res) => {
  try {
    const { user_id, date_debut, date_fin, montant } = req.body;

    const [user] = await pool.execute(
      'SELECT id, nom, prenom FROM users WHERE id = ? AND statut = "actif"', [user_id]
    );
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable ou inactif' });
    }

    const [abonnementActif] = await pool.execute(
      'SELECT id FROM abonnements WHERE user_id = ? AND statut = "actif" AND date_fin >= CURDATE()',
      [user_id]
    );
    if (abonnementActif.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet utilisateur possède déjà un abonnement actif' });
    }

    const [parametres] = await pool.execute(
      'SELECT valeur FROM parametres WHERE cle = "abonnement_mensuel"'
    );
    const montantFinal = montant || parseFloat(parametres[0]?.valeur) || 2500;

    const [result] = await pool.execute(
      `INSERT INTO abonnements (user_id, date_debut, date_fin, montant)
       VALUES (?, ?, ?, ?)`,
      [user_id, date_debut, date_fin, montantFinal]
    );

    const [newAbonnement] = await pool.execute(
      `SELECT a.*, u.nom, u.prenom, u.email FROM abonnements a
       JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Abonnement créé avec succès',
      data: newAbonnement[0],
    });
  } catch (error) {
    console.error('createAbonnement error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateStatutAbonnement = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const [existing] = await pool.execute('SELECT id FROM abonnements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Abonnement introuvable' });
    }

    await pool.execute('UPDATE abonnements SET statut = ? WHERE id = ?', [statut, id]);

    const [updated] = await pool.execute(
      `SELECT a.*, u.nom, u.prenom, u.email FROM abonnements a
       JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
      [id]
    );

    return res.status(200).json({ success: true, message: 'Statut mis à jour', data: updated[0] });
  } catch (error) {
    console.error('updateStatutAbonnement error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const verifierAbonnementActif = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const [rows] = await pool.execute(
      `SELECT * FROM abonnements 
       WHERE user_id = ? AND statut = 'actif' AND date_fin >= CURDATE()
       ORDER BY date_fin DESC LIMIT 1`,
      [userId]
    );
    return res.status(200).json({
      success: true,
      data: {
        abonnement_actif: rows.length > 0,
        abonnement: rows[0] || null,
      },
    });
  } catch (error) {
    console.error('verifierAbonnementActif error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllAbonnements,
  getMyAbonnements,
  getAbonnementById,
  createAbonnement,
  updateStatutAbonnement,
  verifierAbonnementActif,
};