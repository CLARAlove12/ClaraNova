const pool = require('../config/database');

const getAllExemplaires = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, l.titre AS livre_titre, l.isbn
       FROM exemplaires e
       JOIN livres l ON e.livre_id = l.id
       ORDER BY e.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Exemplaires récupérés', data: rows });
  } catch (error) {
    console.error('getAllExemplaires error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getExemplairesByLivre = async (req, res) => {
  try {
    const { livreId } = req.params;

    const [livre] = await pool.execute('SELECT id, titre FROM livres WHERE id = ?', [livreId]);
    if (livre.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM exemplaires WHERE livre_id = ? ORDER BY created_at ASC`,
      [livreId]
    );

    return res.status(200).json({
      success: true,
      message: 'Exemplaires récupérés',
      data: { livre: livre[0], exemplaires: rows },
    });
  } catch (error) {
    console.error('getExemplairesByLivre error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getExemplaireById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT e.*, l.titre AS livre_titre, l.isbn
       FROM exemplaires e
       JOIN livres l ON e.livre_id = l.id
       WHERE e.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exemplaire introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Exemplaire récupéré', data: rows[0] });
  } catch (error) {
    console.error('getExemplaireById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createExemplaire = async (req, res) => {
  try {
    const { livre_id, code_barre, etat } = req.body;

    const [livre] = await pool.execute('SELECT id FROM livres WHERE id = ?', [livre_id]);
    if (livre.length === 0) {
      return res.status(404).json({ success: false, message: 'Livre introuvable' });
    }

    const [existingCode] = await pool.execute(
      'SELECT id FROM exemplaires WHERE code_barre = ?', [code_barre]
    );
    if (existingCode.length > 0) {
      return res.status(409).json({ success: false, message: 'Ce code barre existe déjà' });
    }

    const [result] = await pool.execute(
      `INSERT INTO exemplaires (livre_id, code_barre, etat) VALUES (?, ?, ?)`,
      [livre_id, code_barre, etat || 'neuf']
    );

    await pool.execute(
      'UPDATE livres SET nb_exemplaires = nb_exemplaires + 1 WHERE id = ?',
      [livre_id]
    );

    const [newExemplaire] = await pool.execute(
      `SELECT e.*, l.titre AS livre_titre FROM exemplaires e
       JOIN livres l ON e.livre_id = l.id WHERE e.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Exemplaire créé avec succès',
      data: newExemplaire[0],
    });
  } catch (error) {
    console.error('createExemplaire error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateExemplaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat, disponible } = req.body;

    const [existing] = await pool.execute('SELECT id FROM exemplaires WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Exemplaire introuvable' });
    }

    const fields = [];
    const values = [];

    if (etat) { fields.push('etat = ?'); values.push(etat); }
    if (disponible !== undefined) { fields.push('disponible = ?'); values.push(disponible ? 1 : 0); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);
    await pool.execute(`UPDATE exemplaires SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.execute(
      `SELECT e.*, l.titre AS livre_titre FROM exemplaires e
       JOIN livres l ON e.livre_id = l.id WHERE e.id = ?`,
      [id]
    );

    return res.status(200).json({ success: true, message: 'Exemplaire mis à jour', data: updated[0] });
  } catch (error) {
    console.error('updateExemplaire error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteExemplaire = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT id, livre_id FROM exemplaires WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Exemplaire introuvable' });
    }

    const [emprunts] = await pool.execute(
      "SELECT id FROM emprunts WHERE exemplaire_id = ? AND statut = 'en_cours'", [id]
    );
    if (emprunts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Impossible de supprimer : cet exemplaire est actuellement emprunté',
      });
    }

    const livre_id = existing[0].livre_id;
    await pool.execute('DELETE FROM exemplaires WHERE id = ?', [id]);

    await pool.execute(
      'UPDATE livres SET nb_exemplaires = GREATEST(nb_exemplaires - 1, 0) WHERE id = ?',
      [livre_id]
    );

    return res.status(200).json({ success: true, message: 'Exemplaire supprimé avec succès' });
  } catch (error) {
    console.error('deleteExemplaire error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAllExemplaires, getExemplairesByLivre, getExemplaireById, createExemplaire, updateExemplaire, deleteExemplaire };