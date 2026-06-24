const bcrypt = require('bcrypt');
const pool = require('../config/database');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.adresse,
              u.statut, u.email_verifie, u.photo, u.created_at,
              r.nom AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json({ success: true, message: 'Utilisateurs récupérés', data: rows });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.adresse,
              u.statut, u.email_verifie, u.photo, u.created_at, u.updated_at,
              r.nom AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Utilisateur récupéré', data: rows[0] });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.adresse,
              u.statut, u.email_verifie, u.photo, u.created_at, u.updated_at,
              r.nom AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    return res.status(200).json({ success: true, message: 'Profil récupéré', data: rows[0] });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse } = req.body;
    const userId = req.user.id;

    const fields = [];
    const values = [];

    if (nom) { fields.push('nom = ?'); values.push(nom); }
    if (prenom) { fields.push('prenom = ?'); values.push(prenom); }
    if (telephone) { fields.push('telephone = ?'); values.push(telephone); }
    if (adresse) { fields.push('adresse = ?'); values.push(adresse); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.adresse,
              u.photo, r.nom AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [userId]
    );

    return res.status(200).json({ success: true, message: 'Profil mis à jour', data: rows[0] });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const uploadPhoto = async (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
    }

    try {
      const userId = req.user.id;
      const [rows] = await pool.execute('SELECT photo FROM users WHERE id = ?', [userId]);

      if (rows[0]?.photo) {
        const oldPath = path.join('uploads', path.basename(rows[0].photo));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const photoUrl = `/uploads/${req.file.filename}`;
      await pool.execute('UPDATE users SET photo = ? WHERE id = ?', [photoUrl, userId]);

      return res.status(200).json({ success: true, message: 'Photo mise à jour', data: { photo: photoUrl } });
    } catch (error) {
      console.error('uploadPhoto error:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  });
};

const changePassword = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    const userId = req.user.id;

    const [rows] = await pool.execute('SELECT mot_de_passe FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    const isValid = await bcrypt.compare(ancien_mot_de_passe, user.mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);
    await pool.execute('UPDATE users SET mot_de_passe = ? WHERE id = ?', [hashedPassword, userId]);

    return res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas modifier votre propre statut' });
    }

    const [rows] = await pool.execute('SELECT id, nom, prenom FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    await pool.execute('UPDATE users SET statut = ? WHERE id = ?', [statut, id]);

    return res.status(200).json({
      success: true,
      message: `Statut de ${rows[0].prenom} ${rows[0].nom} mis à jour : ${statut}`,
    });
  } catch (error) {
    console.error('updateStatut error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const [rows] = await pool.execute('SELECT id, photo FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    if (rows[0].photo) {
      const oldPath = path.join('uploads', path.basename(rows[0].photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateProfile,
  uploadPhoto,
  changePassword,
  updateStatut,
  deleteUser,
};