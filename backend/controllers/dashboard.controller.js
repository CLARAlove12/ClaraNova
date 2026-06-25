const pool = require('../config/database');

const getDashboardAdmin = async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_livres }]] = await pool.execute('SELECT COUNT(*) AS total_livres FROM livres');
    const [[{ total_emprunts_en_cours }]] = await pool.execute(
      'SELECT COUNT(*) AS total_emprunts_en_cours FROM emprunts WHERE statut = "en_cours"'
    );
    const [[{ total_emprunts_en_retard }]] = await pool.execute(
      'SELECT COUNT(*) AS total_emprunts_en_retard FROM emprunts WHERE statut = "en_cours" AND date_retour_prevue < CURDATE()'
    );
    const [[{ total_reservations_attente }]] = await pool.execute(
      'SELECT COUNT(*) AS total_reservations_attente FROM reservations WHERE statut = "en_attente"'
    );
    const [[{ total_penalites_impayees }]] = await pool.execute(
      'SELECT COUNT(*) AS total_penalites_impayees FROM penalites WHERE statut = "impayee"'
    );
    const [[{ montant_penalites_impayees }]] = await pool.execute(
      'SELECT COALESCE(SUM(montant), 0) AS montant_penalites_impayees FROM penalites WHERE statut = "impayee"'
    );
    const [[{ total_abonnements_actifs }]] = await pool.execute(
      'SELECT COUNT(*) AS total_abonnements_actifs FROM abonnements WHERE statut = "actif" AND date_fin >= CURDATE()'
    );

    const [emprunts_par_mois] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS mois, COUNT(*) AS total
       FROM emprunts
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY mois ORDER BY mois ASC`
    );

    const [livres_populaires] = await pool.execute(
      `SELECT l.titre, l.image, COUNT(e.id) AS nb_emprunts,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM emprunts e
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       GROUP BY l.id ORDER BY nb_emprunts DESC LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard admin',
      data: {
        stats: {
          total_users,
          total_livres,
          total_emprunts_en_cours,
          total_emprunts_en_retard,
          total_reservations_attente,
          total_penalites_impayees,
          montant_penalites_impayees,
          total_abonnements_actifs,
        },
        emprunts_par_mois,
        livres_populaires,
      },
    });
  } catch (error) {
    console.error('getDashboardAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getDashboardBibliothecaire = async (req, res) => {
  try {
    const [[{ emprunts_du_jour }]] = await pool.execute(
      'SELECT COUNT(*) AS emprunts_du_jour FROM emprunts WHERE DATE(created_at) = CURDATE()'
    );
    const [[{ retours_du_jour }]] = await pool.execute(
      'SELECT COUNT(*) AS retours_du_jour FROM retours WHERE DATE(created_at) = CURDATE()'
    );
    const [[{ emprunts_en_retard }]] = await pool.execute(
      'SELECT COUNT(*) AS emprunts_en_retard FROM emprunts WHERE statut = "en_cours" AND date_retour_prevue < CURDATE()'
    );
    const [[{ reservations_en_attente }]] = await pool.execute(
      'SELECT COUNT(*) AS reservations_en_attente FROM reservations WHERE statut = "en_attente"'
    );

    const [derniers_emprunts] = await pool.execute(
      `SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.statut,
              u.nom AS user_nom, u.prenom AS user_prenom,
              l.titre AS livre_titre
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       ORDER BY e.created_at DESC LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard bibliothécaire',
      data: {
        stats: { emprunts_du_jour, retours_du_jour, emprunts_en_retard, reservations_en_attente },
        derniers_emprunts,
      },
    });
  } catch (error) {
    console.error('getDashboardBibliothecaire error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getDashboardLecteur = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [[{ emprunts_en_cours }]] = await pool.execute(
      'SELECT COUNT(*) AS emprunts_en_cours FROM emprunts WHERE user_id = ? AND statut = "en_cours"',
      [user_id]
    );
    const [[{ reservations_en_attente }]] = await pool.execute(
      'SELECT COUNT(*) AS reservations_en_attente FROM reservations WHERE user_id = ? AND statut = "en_attente"',
      [user_id]
    );
    const [[{ penalites_impayees }]] = await pool.execute(
      'SELECT COUNT(*) AS penalites_impayees FROM penalites WHERE user_id = ? AND statut = "impayee"',
      [user_id]
    );
    const [[{ montant_du }]] = await pool.execute(
      'SELECT COALESCE(SUM(montant), 0) AS montant_du FROM penalites WHERE user_id = ? AND statut = "impayee"',
      [user_id]
    );

    const [abonnement_actif] = await pool.execute(
      'SELECT * FROM abonnements WHERE user_id = ? AND statut = "actif" AND date_fin >= CURDATE() LIMIT 1',
      [user_id]
    );

    const [emprunts_recents] = await pool.execute(
      `SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.statut,
              l.titre AS livre_titre, l.image AS livre_image,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM emprunts e
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC LIMIT 5`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard lecteur',
      data: {
        stats: { emprunts_en_cours, reservations_en_attente, penalites_impayees, montant_du },
        abonnement: abonnement_actif[0] || null,
        emprunts_recents,
      },
    });
  } catch (error) {
    console.error('getDashboardLecteur error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getDashboardAdmin, getDashboardBibliothecaire, getDashboardLecteur };