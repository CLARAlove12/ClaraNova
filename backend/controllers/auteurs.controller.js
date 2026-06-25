const pool = require('../config/database');

const getAllAuteurs = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, COUNT(l.id) AS nombre_livres
       FROM auteurs a
       LEFT JOIN livres l ON a.id = l.auteur_id
       GROUP BY a.id
       ORDER BY a.nom ASC`
    );
    return res.status(200).json({ success: true, message: 'Auteurs récupérés', data: rows });
  } catch (error) {
    console.error('getAllAuteurs error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getAuteurById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT a.*, COUNT(l.id) AS nombre_livres
       FROM auteurs a
       LEFT JOIN livres l ON a.id = l.auteur_id
       WHERE a.id = ?
       GROUP BY a.id`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Auteur introuvable' });
    }

    const [livres] = await pool.execute(
      `SELECT l.id, l.titre, l.isbn, l.statut, l.date_publication, c.nom AS categorie
       FROM livres l
       LEFT JOIN categories c ON l.categorie_id = c.id
       WHERE l.auteur_id = ?
       ORDER BY l.titre ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Auteur récupéré',
      data: { ...rows[0], livres },
    });
  } catch (error) {
    console.error('getAuteurById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createAuteur = async (req, res) => {
  try {
    const { nom, prenom, nationalite, biographie } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO auteurs (nom, prenom, nationalite, biographie)
       VALUES (?, ?, ?, ?)`,
      [nom, prenom, nationalite || null, biographie || null]
    );

    const [newAuteur] = await pool.execute(
      'SELECT * FROM auteurs WHERE id = ?', [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Auteur créé avec succès',
      data: newAuteur[0],
    });
  } catch (error) {
    console.error('createAuteur error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateAuteur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, nationalite, biographie } = req.body;

    const [existing] = await pool.execute('SELECT id FROM auteurs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Auteur introuvable' });
    }

    const fields = [];
    const values = [];

    if (nom) { fields.push('nom = ?'); values.push(nom); }
    if (prenom) { fields.push('prenom = ?'); values.push(prenom); }
    if (nationalite !== undefined) { fields.push('nationalite = ?'); values.push(nationalite); }
    if (biographie !== undefined) { fields.push('biographie = ?'); values.push(biographie); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);
    await pool.execute(`UPDATE auteurs SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.execute('SELECT * FROM auteurs WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Auteur mis à jour avec succès',
      data: updated[0],
    });
  } catch (error) {
    console.error('updateAuteur error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteAuteur = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM auteurs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Auteur introuvable' });
    }

    const [livres] = await pool.execute(
      'SELECT id FROM livres WHERE auteur_id = ?', [id]
    );
    if (livres.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : cet auteur possède ${livres.length} livre(s) associé(s)`,
      });
    }

    await pool.execute('DELETE FROM auteurs WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Auteur supprimé avec succès' });
  } catch (error) {
    console.error('deleteAuteur error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllAuteurs, getAuteurById, createAuteur, updateAuteur, deleteAuteur };