const pool = require('../config/database');

const getAllPaiements = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email
       FROM paiements p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.date_paiement DESC`
    );
    return res.status(200).json({ success: true, message: 'Paiements récupérés', data: rows });
  } catch (error) {
    console.error('getAllPaiements error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyPaiements = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM paiements WHERE user_id = ? ORDER BY date_paiement DESC',
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Mes paiements', data: rows });
  } catch (error) {
    console.error('getMyPaiements error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createPaiement = async (req, res) => {
  try {
    const { type, reference_id, montant, moyen, reference_transaction } = req.body;
    const user_id = req.user.id;

    if (type === 'abonnement') {
      const [abonnement] = await pool.execute('SELECT id, montant FROM abonnements WHERE id = ?', [reference_id]);
      if (abonnement.length === 0) {
        return res.status(404).json({ success: false, message: 'Abonnement introuvable' });
      }
    } else if (type === 'penalite') {
      const [penalite] = await pool.execute('SELECT id, montant, statut FROM penalites WHERE id = ?', [reference_id]);
      if (penalite.length === 0) {
        return res.status(404).json({ success: false, message: 'Pénalité introuvable' });
      }
      if (penalite[0].statut === 'payee') {
        return res.status(409).json({ success: false, message: 'Cette pénalité est déjà payée' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO paiements (user_id, type, reference_id, montant, moyen, statut, reference_transaction)
       VALUES (?, ?, ?, ?, ?, 'en_attente', ?)`,
      [user_id, type, reference_id, montant, moyen, reference_transaction || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Paiement initié avec succès',
      data: { paiement_id: result.insertId },
    });
  } catch (error) {
    console.error('createPaiement error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const validerPaiement = async (req, res) => {
  try {
    const { id } = req.params;

    const [paiement] = await pool.execute('SELECT * FROM paiements WHERE id = ?', [id]);
    if (paiement.length === 0) {
      return res.status(404).json({ success: false, message: 'Paiement introuvable' });
    }
    if (paiement[0].statut === 'valide') {
      return res.status(409).json({ success: false, message: 'Ce paiement est déjà validé' });
    }

    await pool.execute('UPDATE paiements SET statut = "valide" WHERE id = ?', [id]);

    if (paiement[0].type === 'abonnement') {
      await pool.execute('UPDATE abonnements SET statut = "actif" WHERE id = ?', [paiement[0].reference_id]);
    } else if (paiement[0].type === 'penalite') {
      await pool.execute('UPDATE penalites SET statut = "payee" WHERE id = ?', [paiement[0].reference_id]);
    }

    return res.status(200).json({ success: true, message: 'Paiement validé avec succès' });
  } catch (error) {
    console.error('validerPaiement error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllPaiements, getMyPaiements, createPaiement, validerPaiement };