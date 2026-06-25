const pool = require('../config/database');

const getAllRetours = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
              u.nom AS user_nom, u.prenom AS user_prenom,
              b.nom AS bibliothecaire_nom, b.prenom AS bibliothecaire_prenom,
              l.titre AS livre_titre, ex.code_barre,
              e.date_emprunt, e.date_retour_prevue,
              DATEDIFF(r.date_retour_reelle, e.date_retour_prevue) AS jours_retard
       FROM retours r
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN users u ON e.user_id = u.id
       JOIN users b ON r.bibliothecaire_id = b.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       ORDER BY r.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Retours récupérés', data: rows });
  } catch (error) {
    console.error('getAllRetours error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getRetourById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT r.*,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
              b.nom AS bibliothecaire_nom, b.prenom AS bibliothecaire_prenom,
              l.titre AS livre_titre, ex.code_barre,
              e.date_emprunt, e.date_retour_prevue,
              DATEDIFF(r.date_retour_reelle, e.date_retour_prevue) AS jours_retard
       FROM retours r
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN users u ON e.user_id = u.id
       JOIN users b ON r.bibliothecaire_id = b.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE r.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Retour introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Retour récupéré', data: rows[0] });
  } catch (error) {
    console.error('getRetourById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createRetour = async (req, res) => {
  try {
    const { emprunt_id, etat_livre, observations } = req.body;
    const bibliothecaire_id = req.user.id;

    const [emprunt] = await pool.execute(
      'SELECT * FROM emprunts WHERE id = ? AND statut = "en_cours"', [emprunt_id]
    );
    if (emprunt.length === 0) {
      return res.status(404).json({ success: false, message: 'Emprunt introuvable ou déjà retourné' });
    }

    const [existingRetour] = await pool.execute(
      'SELECT id FROM retours WHERE emprunt_id = ?', [emprunt_id]
    );
    if (existingRetour.length > 0) {
      return res.status(409).json({ success: false, message: 'Un retour existe déjà pour cet emprunt' });
    }

    const [result] = await pool.execute(
      `INSERT INTO retours (emprunt_id, bibliothecaire_id, etat_livre, observations)
       VALUES (?, ?, ?, ?)`,
      [emprunt_id, bibliothecaire_id, etat_livre, observations || null]
    );

    await pool.execute(
      'UPDATE emprunts SET statut = "retourne" WHERE id = ?', [emprunt_id]
    );

    const nouvelEtat = etat_livre === 'perdu' ? 'perdu' : etat_livre === 'bon_etat' ? 'bon_etat' : 'use';
    const disponible = etat_livre === 'perdu' ? 0 : 1;
    await pool.execute(
      'UPDATE exemplaires SET disponible = ?, etat = ? WHERE id = ?',
      [disponible, nouvelEtat, emprunt[0].exemplaire_id]
    );

    const dateRetourPrevue = new Date(emprunt[0].date_retour_prevue);
    const dateRetourReelle = new Date();
    const joursRetard = Math.max(
      0,
      Math.floor((dateRetourReelle - dateRetourPrevue) / (1000 * 60 * 60 * 24))
    );

    let penaliteCreee = null;

    if (joursRetard > 0 || ['dechire', 'sale', 'perdu'].includes(etat_livre)) {
      const [parametres] = await pool.execute(
        'SELECT cle, valeur FROM parametres WHERE cle IN ("amende_retard_par_jour", "amende_dechire", "amende_sale", "amende_perte_frais_fixes")'
      );
      const params = {};
      parametres.forEach(p => { params[p.cle] = parseFloat(p.valeur); });

      let montantPenalite = 0;
      let motif = 'retard';

      if (etat_livre === 'dechire') {
        montantPenalite = params.amende_dechire || 5000;
        motif = 'dechire';
      } else if (etat_livre === 'sale') {
        montantPenalite = params.amende_sale || 2000;
        motif = 'sale';
      } else if (etat_livre === 'perdu') {
        montantPenalite = params.amende_perte_frais_fixes || 2000;
        motif = 'perdu';
      } else if (joursRetard > 0) {
        montantPenalite = joursRetard * (params.amende_retard_par_jour || 500);
        motif = 'retard';
      }

      if (montantPenalite > 0) {
        const [penalite] = await pool.execute(
          `INSERT INTO penalites (retour_id, user_id, motif, montant)
           VALUES (?, ?, ?, ?)`,
          [result.insertId, emprunt[0].user_id, motif, montantPenalite]
        );
        penaliteCreee = { id: penalite.insertId, motif, montant: montantPenalite };
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Retour enregistré avec succès',
      data: { retour_id: result.insertId, penalite: penaliteCreee },
    });
  } catch (error) {
    console.error('createRetour error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllRetours, getRetourById, createRetour };