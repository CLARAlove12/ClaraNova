const pool = require('../config/database');

const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(l.id) AS nombre_livres
       FROM categories c
       LEFT JOIN livres l ON c.id = l.categorie_id
       GROUP BY c.id
       ORDER BY c.nom ASC`
    );
    return res.status(200).json({ success: true, message: 'Catégories récupérées', data: rows });
  } catch (error) {
    console.error('getAllCategories error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getCategorieById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(l.id) AS nombre_livres
       FROM categories c
       LEFT JOIN livres l ON c.id = l.categorie_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' });
    }

    const [livres] = await pool.execute(
      `SELECT l.id, l.titre, l.isbn, l.statut, l.prix,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom
       FROM livres l
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       WHERE l.categorie_id = ?
       ORDER BY l.titre ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Catégorie récupérée',
      data: { ...rows[0], livres },
    });
  } catch (error) {
    console.error('getCategorieById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createCategorie = async (req, res) => {
  try {
    const { nom, description } = req.body;

    const [existing] = await pool.execute('SELECT id FROM categories WHERE nom = ?', [nom]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Cette catégorie existe déjà' });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (nom, description) VALUES (?, ?)',
      [nom, description || null]
    );

    const [newCategorie] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: newCategorie[0],
    });
  } catch (error) {
    console.error('createCategorie error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;

    const [existing] = await pool.execute('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' });
    }

    if (nom) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM categories WHERE nom = ? AND id != ?', [nom, id]
      );
      if (duplicate.length > 0) {
        return res.status(409).json({ success: false, message: 'Ce nom de catégorie existe déjà' });
      }
    }

    const fields = [];
    const values = [];

    if (nom) { fields.push('nom = ?'); values.push(nom); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);
    await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: updated[0],
    });
  } catch (error) {
    console.error('updateCategorie error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteCategorie = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' });
    }

    const [livres] = await pool.execute('SELECT id FROM livres WHERE categorie_id = ?', [id]);
    if (livres.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : cette catégorie contient ${livres.length} livre(s)`,
      });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('deleteCategorie error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllCategories, getCategorieById, createCategorie, updateCategorie, deleteCategorie };