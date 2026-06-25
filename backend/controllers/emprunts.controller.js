const pool = require('../config/database');

const getAllEmprunts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              b.nom AS bibliothecaire_nom, b.prenom AS bibliothecaire_prenom,
              ex.code_barre, l.titre AS livre_titre, l.isbn
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN users b ON e.bibliothecaire_id = b.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       ORDER BY e.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Emprunts récupérés', data: rows });
  } catch (error) {
    console.error('getAllEmprunts error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyEmprunts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*,
              ex.code_barre, ex.etat AS etat_exemplaire,
              l.titre AS livre_titre, l.isbn, l.image AS livre_image,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM emprunts e
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Mes emprunts', data: rows });
  } catch (error) {
    console.error('getMyEmprunts error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getEmpruntById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT e.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              b.nom AS bibliothecaire_nom, b.prenom AS bibliothecaire_prenom,
              ex.code_barre, ex.etat AS etat_exemplaire,
              l.titre AS livre_titre, l.isbn, l.image AS livre_image,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN users b ON e.bibliothecaire_id = b.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       WHERE e.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emprunt introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Emprunt récupéré', data: rows[0] });
  } catch (error) {
    console.error('getEmpruntById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createEmprunt = async (req, res) => {
  try {
    const { user_id, exemplaire_id, date_retour_prevue } = req.body;
    const bibliothecaire_id = req.user.id;

    const [user] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND statut = "actif"', [user_id]
    );
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable ou inactif' });
    }

    const [abonnement] = await pool.execute(
      'SELECT id FROM abonnements WHERE user_id = ? AND statut = "actif" AND date_fin >= CURDATE()',
      [user_id]
    );
    if (abonnement.length === 0) {
      return res.status(403).json({ success: false, message: 'Cet utilisateur n\'a pas d\'abonnement actif' });
    }

    const [parametres] = await pool.execute(
      'SELECT cle, valeur FROM parametres WHERE cle IN ("limite_emprunts_simultanes", "duree_emprunt_jours")'
    );
    const params = {};
    parametres.forEach(p => { params[p.cle] = parseInt(p.valeur, 10); });
    const limiteEmprunts = params.limite_emprunts_simultanes || 3;
    const dureeEmprunt = params.duree_emprunt_jours || 14;

    const [empruntsEnCours] = await pool.execute(
      'SELECT id FROM emprunts WHERE user_id = ? AND statut = "en_cours"', [user_id]
    );
    if (empruntsEnCours.length >= limiteEmprunts) {
      return res.status(409).json({
        success: false,
        message: `Limite atteinte : maximum ${limiteEmprunts} emprunts simultanés`,
      });
    }

    const [exemplaire] = await pool.execute(
      'SELECT id, disponible FROM exemplaires WHERE id = ?', [exemplaire_id]
    );
    if (exemplaire.length === 0) {
      return res.status(404).json({ success: false, message: 'Exemplaire introuvable' });
    }
    if (!exemplaire[0].disponible) {
      return res.status(409).json({ success: false, message: 'Cet exemplaire n\'est pas disponible' });
    }

    const dateRetour = date_retour_prevue || new Date(Date.now() + dureeEmprunt * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [result] = await pool.execute(
      `INSERT INTO emprunts (user_id, exemplaire_id, bibliothecaire_id, date_retour_prevue)
       VALUES (?, ?, ?, ?)`,
      [user_id, exemplaire_id, bibliothecaire_id, dateRetour]
    );

    await pool.execute(
      'UPDATE exemplaires SET disponible = 0 WHERE id = ?', [exemplaire_id]
    );

    const [newEmprunt] = await pool.execute(
      `SELECT e.*, u.nom AS user_nom, u.prenom AS user_prenom,
              ex.code_barre, l.titre AS livre_titre
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Emprunt créé avec succès',
      data: newEmprunt[0],
    });
  } catch (error) {
    console.error('createEmprunt error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateStatutEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const [existing] = await pool.execute('SELECT * FROM emprunts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Emprunt introuvable' });
    }

    await pool.execute('UPDATE emprunts SET statut = ? WHERE id = ?', [statut, id]);

    if (statut === 'perdu') {
      await pool.execute(
        'UPDATE exemplaires SET disponible = 0, etat = "perdu" WHERE id = ?',
        [existing[0].exemplaire_id]
      );
    }

    return res.status(200).json({ success: true, message: 'Statut emprunt mis à jour' });
  } catch (error) {
    console.error('updateStatutEmprunt error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getEmpruntsEnRetard = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              u.telephone, ex.code_barre, l.titre AS livre_titre,
              DATEDIFF(CURDATE(), e.date_retour_prevue) AS jours_retard
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE e.statut = 'en_cours' AND e.date_retour_prevue < CURDATE()
       ORDER BY jours_retard DESC`
    );
    return res.status(200).json({ success: true, message: 'Emprunts en retard', data: rows });
  } catch (error) {
    console.error('getEmpruntsEnRetard error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllEmprunts, getMyEmprunts, getEmpruntById, createEmprunt, updateStatutEmprunt, getEmpruntsEnRetard };