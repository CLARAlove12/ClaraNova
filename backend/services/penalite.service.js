const pool = require('../config/database');

const getParametres = async () => {
  const [rows] = await pool.execute(
    `SELECT cle, valeur FROM parametres 
     WHERE cle IN ('amende_retard_par_jour','amende_dechire','amende_sale','amende_perte_frais_fixes')`
  );
  const params = {};
  rows.forEach(r => { params[r.cle] = parseFloat(r.valeur); });
  return params;
};

const calculerMontantPenalite = async (etat_livre, jours_retard) => {
  const params = await getParametres();
  let montant = 0;
  let motif = 'retard';

  if (etat_livre === 'dechire') {
    montant = params.amende_dechire || 5000;
    motif = 'dechire';
  } else if (etat_livre === 'sale') {
    montant = params.amende_sale || 2000;
    motif = 'sale';
  } else if (etat_livre === 'perdu') {
    montant = params.amende_perte_frais_fixes || 2000;
    motif = 'perdu';
  } else if (jours_retard > 0) {
    montant = jours_retard * (params.amende_retard_par_jour || 500);
    motif = 'retard';
  }

  return { montant, motif };
};

const creerPenalite = async (retour_id, user_id, motif, montant) => {
  const [result] = await pool.execute(
    `INSERT INTO penalites (retour_id, user_id, motif, montant)
     VALUES (?, ?, ?, ?)`,
    [retour_id, user_id, motif, montant]
  );
  return result.insertId;
};

const calculerJoursRetard = (date_retour_prevue) => {
  const dateRetourPrevue = new Date(date_retour_prevue);
  const dateAujourdhui = new Date();
  const diffMs = dateAujourdhui - dateRetourPrevue;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const getPenalitesImpayeesUser = async (user_id) => {
  const [rows] = await pool.execute(
    `SELECT p.*, l.titre AS livre_titre
     FROM penalites p
     JOIN retours r ON p.retour_id = r.id
     JOIN emprunts e ON r.emprunt_id = e.id
     JOIN exemplaires ex ON e.exemplaire_id = ex.id
     JOIN livres l ON ex.livre_id = l.id
     WHERE p.user_id = ? AND p.statut = 'impayee'`,
    [user_id]
  );
  const total = rows.reduce((sum, p) => sum + parseFloat(p.montant), 0);
  return { penalites: rows, total };
};

const userADesImpayees = async (user_id) => {
  const { penalites } = await getPenalitesImpayeesUser(user_id);
  return penalites.length > 0;
};

module.exports = {
  calculerMontantPenalite,
  creerPenalite,
  calculerJoursRetard,
  getPenalitesImpayeesUser,
  userADesImpayees,
};