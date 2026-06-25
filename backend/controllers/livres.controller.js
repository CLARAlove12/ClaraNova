const pool = require('../config/database');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

const getAllLivres = async (req, res) => {
  try {
    const { q, categorie_id, auteur_id, statut } = req.query;

    let query = `
      SELECT l.*, 
             a.nom AS auteur_nom, a.prenom AS auteur_prenom,
             c.nom AS categorie_nom,
             COUNT(DISTINCT e.id) AS nb_exemplaires_disponibles
      FROM livres l
      LEFT JOIN auteurs a ON l.auteur_id = a.id
      LEFT JOIN categories c ON l.categorie_id = c.id
      LEFT JOIN exemplaires e ON l.id = e.livre_id AND e.disponible = 1
    `;

    const conditions = [];
    const values = [];

    if (q) {
      conditions.push('(l.titre LIKE ? OR l.isbn LIKE ? OR a.nom LIKE ? OR a.prenom LIKE ?)');
      const searchTerm = `%${q}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (categorie_id) { conditions.push('l.categorie_id = ?'); values.push(categorie_id); }
    if (auteur_id) { conditions.push('l.auteur_id = ?'); values.push(auteur_id); }
    if (statut) { conditions.push('l.statut = ?'); values.push(statut); }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY l.id ORDER BY l.created_at DESC';

    const [rows] = await pool.execute(query, values);
    return res.status(200).json({ success: true, message: 'Livres récupérés', data: rows });
  } catch (error) {
    console.error('getAllLivres error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getLivreById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT l.*,
              a.nom AS auteur_nom, a.prenom AS auteur_prenom, a.nationalite,
              c.nom AS categorie_nom
       FROM livres l
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       LEFT JOIN categories c ON l.categorie_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }

    const [exemplaires] = await pool.execute(
      `SELECT id, code_barre, etat, disponible, created_at
       FROM exemplaires WHERE livre_id = ? ORDER BY created_at ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Livre récupéré',
      data: { ...rows[0], exemplaires },
    });
  } catch (error) {
    console.error('getLivreById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createLivre = async (req, res) => {
  try {
    const { titre, isbn, resume, auteur_id, categorie_id, date_publication, nb_exemplaires, prix } = req.body;

    if (isbn) {
      const [existing] = await pool.execute('SELECT id FROM livres WHERE isbn = ?', [isbn]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Un livre avec cet ISBN existe déjà' });
      }
    }

    if (auteur_id) {
      const [auteur] = await pool.execute('SELECT id FROM auteurs WHERE id = ?', [auteur_id]);
      if (auteur.length === 0) {
        return res.status(404).json({ success: false, message: 'Auteur introuvable' });
      }
    }

    if (categorie_id) {
      const [categorie] = await pool.execute('SELECT id FROM categories WHERE id = ?', [categorie_id]);
      if (categorie.length === 0) {
        return res.status(404).json({ success: false, message: 'Catégorie introuvable' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO livres (titre, isbn, resume, auteur_id, categorie_id, date_publication, nb_exemplaires, prix)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre,
        isbn || null,
        resume || null,
        auteur_id || null,
        categorie_id || null,
        date_publication || null,
        nb_exemplaires || 1,
        prix || 0,
      ]
    );

    const [newLivre] = await pool.execute(
      `SELECT l.*, a.nom AS auteur_nom, a.prenom AS auteur_prenom, c.nom AS categorie_nom
       FROM livres l
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       LEFT JOIN categories c ON l.categorie_id = c.id
       WHERE l.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Livre créé avec succès', data: newLivre[0] });
  } catch (error) {
    console.error('createLivre error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateLivre = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, isbn, resume, auteur_id, categorie_id, date_publication, nb_exemplaires, prix, statut } = req.body;

    const [existing] = await pool.execute('SELECT id FROM livres WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }

    if (isbn) {
      const [duplicate] = await pool.execute('SELECT id FROM livres WHERE isbn = ? AND id != ?', [isbn, id]);
      if (duplicate.length > 0) {
        return res.status(409).json({ success: false, message: 'Un livre avec cet ISBN existe déjà' });
      }
    }

    const fields = [];
    const values = [];

    if (titre) { fields.push('titre = ?'); values.push(titre); }
    if (isbn !== undefined) { fields.push('isbn = ?'); values.push(isbn); }
    if (resume !== undefined) { fields.push('resume = ?'); values.push(resume); }
    if (auteur_id !== undefined) { fields.push('auteur_id = ?'); values.push(auteur_id); }
    if (categorie_id !== undefined) { fields.push('categorie_id = ?'); values.push(categorie_id); }
    if (date_publication !== undefined) { fields.push('date_publication = ?'); values.push(date_publication); }
    if (nb_exemplaires !== undefined) { fields.push('nb_exemplaires = ?'); values.push(nb_exemplaires); }
    if (prix !== undefined) { fields.push('prix = ?'); values.push(prix); }
    if (statut) { fields.push('statut = ?'); values.push(statut); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);
    await pool.execute(`UPDATE livres SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.execute(
      `SELECT l.*, a.nom AS auteur_nom, a.prenom AS auteur_prenom, c.nom AS categorie_nom
       FROM livres l
       LEFT JOIN auteurs a ON l.auteur_id = a.id
       LEFT JOIN categories c ON l.categorie_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    return res.status(200).json({ success: true, message: 'Livre mis à jour avec succès', data: updated[0] });
  } catch (error) {
    console.error('updateLivre error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const uploadImageLivre = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });

    try {
      const { id } = req.params;
      const [rows] = await pool.execute('SELECT image FROM livres WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Livre introuvable' });

      if (rows[0].image) {
        const oldPath = path.join('uploads', path.basename(rows[0].image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      await pool.execute('UPDATE livres SET image = ? WHERE id = ?', [imageUrl, id]);

      return res.status(200).json({ success: true, message: 'Image mise à jour', data: { image: imageUrl } });
    } catch (error) {
      console.error('uploadImageLivre error:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  });
};

const deleteLivre = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id, image FROM livres WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }

    const [exemplaires] = await pool.execute('SELECT id FROM exemplaires WHERE livre_id = ?', [id]);
    if (exemplaires.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : ce livre possède ${exemplaires.length} exemplaire(s) associé(s)`,
      });
    }

    if (existing[0].image) {
      const oldPath = path.join('uploads', path.basename(existing[0].image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.execute('DELETE FROM livres WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Livre supprimé avec succès' });
  } catch (error) {
    console.error('deleteLivre error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllLivres, getLivreById, createLivre, updateLivre, uploadImageLivre, deleteLivre };