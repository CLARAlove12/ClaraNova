const pool = require('../config/database');
const PDFDocument = require('pdfkit');

const getRapportEmprunts = async (req, res) => {
  try {
    const { date_debut, date_fin, format } = req.query;

    const [rows] = await pool.execute(
      `SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.statut,
              u.nom AS user_nom, u.prenom AS user_prenom, u.email,
              l.titre AS livre_titre, l.isbn,
              DATEDIFF(COALESCE(r.date_retour_reelle, CURDATE()), e.date_retour_prevue) AS jours_retard
       FROM emprunts e
       JOIN users u ON e.user_id = u.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       LEFT JOIN retours r ON e.id = r.emprunt_id
       WHERE e.date_emprunt BETWEEN ? AND ?
       ORDER BY e.date_emprunt DESC`,
      [date_debut || '2000-01-01', date_fin || new Date().toISOString().split('T')[0]]
    );

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=rapport_emprunts_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text('CNova — Rapport des Emprunts', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Période : ${date_debut || 'Début'} au ${date_fin || "Aujourd'hui"}`);
      doc.text(`Total emprunts : ${rows.length}`);
      doc.moveDown();

      rows.forEach((emprunt, index) => {
        doc.fontSize(10)
          .text(`${index + 1}. ${emprunt.livre_titre} — ${emprunt.user_prenom} ${emprunt.user_nom}`)
          .text(`   Emprunté le : ${emprunt.date_emprunt} | Statut : ${emprunt.statut}`)
          .moveDown(0.5);
      });

      doc.end();
    } else {
      return res.status(200).json({ success: true, message: 'Rapport emprunts', data: rows });
    }
  } catch (error) {
    console.error('getRapportEmprunts error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getRapportPenalites = async (req, res) => {
  try {
    const { date_debut, date_fin, format } = req.query;

    const [rows] = await pool.execute(
      `SELECT p.*, u.nom AS user_nom, u.prenom AS user_prenom, u.email,
              u.telephone, l.titre AS livre_titre
       FROM penalites p
       JOIN users u ON p.user_id = u.id
       JOIN retours r ON p.retour_id = r.id
       JOIN emprunts e ON r.emprunt_id = e.id
       JOIN exemplaires ex ON e.exemplaire_id = ex.id
       JOIN livres l ON ex.livre_id = l.id
       WHERE p.created_at BETWEEN ? AND ?
       ORDER BY p.created_at DESC`,
      [date_debut || '2000-01-01', date_fin || new Date().toISOString().split('T')[0]]
    );

    const total_montant = rows.reduce((sum, p) => sum + parseFloat(p.montant), 0);
    const total_impayees = rows.filter(p => p.statut === 'impayee').reduce((sum, p) => sum + parseFloat(p.montant), 0);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=rapport_penalites_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text('CNova — Rapport des Pénalités', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Total pénalités : ${total_montant.toFixed(2)} FCFA`);
      doc.text(`Dont impayées : ${total_impayees.toFixed(2)} FCFA`);
      doc.moveDown();

      rows.forEach((penalite, index) => {
        doc.fontSize(10)
          .text(`${index + 1}. ${penalite.user_prenom} ${penalite.user_nom} — ${penalite.livre_titre}`)
          .text(`   Motif : ${penalite.motif} | Montant : ${penalite.montant} FCFA | Statut : ${penalite.statut}`)
          .moveDown(0.5);
      });

      doc.end();
    } else {
      return res.status(200).json({
        success: true,
        message: 'Rapport pénalités',
        data: { penalites: rows, total_montant, total_impayees },
      });
    }
  } catch (error) {
    console.error('getRapportPenalites error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getRapportEmprunts, getRapportPenalites };