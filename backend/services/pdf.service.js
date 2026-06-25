const PDFDocument = require('pdfkit');

const genererEnTete = (doc, titre) => {
  doc.fontSize(20).fillColor('#4F46E5').text('CNova', { align: 'center' });
  doc.fontSize(10).fillColor('#888').text('Système de Gestion de Bibliothèque', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#4F46E5').stroke();
  doc.moveDown(0.5);
  doc.fontSize(16).fillColor('#000').text(titre, { align: 'center' });
  doc.fontSize(10).fillColor('#888').text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown();
};

const genererPiedDePage = (doc) => {
  doc.fontSize(8).fillColor('#888')
    .text('CNova — Document confidentiel', 50, doc.page.height - 50, { align: 'center' });
};

const genererRapportEmprunts = (res, emprunts, periode) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=rapport_emprunts_${Date.now()}.pdf`);
  doc.pipe(res);

  genererEnTete(doc, 'Rapport des Emprunts');

  doc.fontSize(11).fillColor('#333');
  doc.text(`Période : ${periode.debut} au ${periode.fin}`);
  doc.text(`Total emprunts : ${emprunts.length}`);
  doc.text(`En cours : ${emprunts.filter(e => e.statut === 'en_cours').length}`);
  doc.text(`Retournés : ${emprunts.filter(e => e.statut === 'retourne').length}`);
  doc.text(`En retard : ${emprunts.filter(e => e.statut === 'en_retard').length}`);
  doc.moveDown();

  doc.fontSize(11).fillColor('#4F46E5').text('Détail des emprunts :', { underline: true });
  doc.moveDown(0.5);

  emprunts.forEach((emprunt, index) => {
    if (doc.y > 700) doc.addPage();
    doc.fontSize(10).fillColor('#000')
      .text(`${index + 1}. ${emprunt.livre_titre}`, { continued: false })
      .fillColor('#555')
      .text(`   Lecteur : ${emprunt.user_prenom} ${emprunt.user_nom} (${emprunt.email})`)
      .text(`   Emprunté : ${emprunt.date_emprunt} | Retour prévu : ${emprunt.date_retour_prevue}`)
      .text(`   Statut : ${emprunt.statut}`)
      .moveDown(0.5);
  });

  genererPiedDePage(doc);
  doc.end();
};

const genererRapportPenalites = (res, penalites, totaux) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=rapport_penalites_${Date.now()}.pdf`);
  doc.pipe(res);

  genererEnTete(doc, 'Rapport des Pénalités');

  doc.fontSize(11).fillColor('#333');
  doc.text(`Total montant : ${totaux.total_montant.toFixed(2)} FCFA`);
  doc.text(`Montant impayé : ${totaux.total_impayees.toFixed(2)} FCFA`);
  doc.text(`Nombre total : ${penalites.length}`);
  doc.text(`Dont impayées : ${penalites.filter(p => p.statut === 'impayee').length}`);
  doc.moveDown();

  doc.fontSize(11).fillColor('#DC2626').text('Détail des pénalités :', { underline: true });
  doc.moveDown(0.5);

  penalites.forEach((penalite, index) => {
    if (doc.y > 700) doc.addPage();
    const couleur = penalite.statut === 'payee' ? '#16A34A' : '#DC2626';
    doc.fontSize(10).fillColor('#000')
      .text(`${index + 1}. ${penalite.user_prenom} ${penalite.user_nom}`)
      .fillColor('#555')
      .text(`   Livre : ${penalite.livre_titre}`)
      .text(`   Motif : ${penalite.motif} | Montant : ${penalite.montant} FCFA`)
      .fillColor(couleur)
      .text(`   Statut : ${penalite.statut}`)
      .fillColor('#555')
      .text(`   Date : ${new Date(penalite.created_at).toLocaleDateString('fr-FR')}`)
      .moveDown(0.5);
  });

  genererPiedDePage(doc);
  doc.end();
};

const genererCarteAdherent = (res, user, abonnement) => {
  const doc = new PDFDocument({ margin: 30, size: [300, 180] });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=carte_${user.id}.pdf`);
  doc.pipe(res);

  doc.rect(0, 0, 300, 180).fillColor('#4F46E5').fill();
  doc.fontSize(14).fillColor('#fff').text('CNova', 20, 20);
  doc.fontSize(8).fillColor('#ccc').text('Carte d\'adhérent', 20, 38);
  doc.moveTo(20, 55).lineTo(280, 55).strokeColor('#fff').lineWidth(0.5).stroke();
  doc.fontSize(13).fillColor('#fff').text(`${user.prenom} ${user.nom}`, 20, 65);
  doc.fontSize(9).fillColor('#ccc').text(`Email : ${user.email}`, 20, 85);
  doc.fontSize(9).fillColor('#ccc').text(`Tél : ${user.telephone || 'N/A'}`, 20, 100);
  doc.fontSize(9).fillColor('#ccc').text(`Membre depuis : ${new Date(user.created_at).toLocaleDateString('fr-FR')}`, 20, 115);
  if (abonnement) {
    doc.fontSize(9).fillColor('#4ade80').text(`Abonnement valide jusqu'au : ${abonnement.date_fin}`, 20, 135);
  }
  doc.fontSize(8).fillColor('#888').text(`ID: #${String(user.id).padStart(5, '0')}`, 20, 155);

  doc.end();
};

module.exports = { genererRapportEmprunts, genererRapportPenalites, genererCarteAdherent };