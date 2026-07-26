// controllers/userController.js
const User = require("../models/User");

// Ajouter un utilisateur (admin uniquement)
exports.ajouterUtilisateur = async (req, res) => {
  try {
    const nouvelUser = new User(req.body);
    await nouvelUser.save();

    await logAudit(req.user.id, "CREATE", "User", nouvelUser._id, req.ip);

    res.status(201).json(nouvelUser);
  } catch (err) {
    res.status(400).json({ message: "Failed to create user.", error: err.message });
  }
};

// Récupérer tous les utilisateurs
exports.listerUtilisateurs = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer un utilisateur par ID
exports.getUtilisateurById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "An error occurred while retrieving the user.", error: err.message });
  }
};

// Mettre à jour un utilisateur (soi-même ou admin uniquement)
exports.updateUtilisateur = async (req, res) => {
  try {
    // Vérification de sécurité : seul le propriétaire du compte ou un admin peut modifier
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own profile." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,          // retourne le document mis à jour
        runValidators: true // applique les validations du schema
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await logAudit(req.user.id, "UPDATE", "User", updatedUser._id, req.ip);

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: "Failed to update user.", error: err.message });
  }
};

// Désactiver un utilisateur (soft delete - admin uniquement)
exports.deleteUtilisateur = async (req, res) => {
  try {
    const deactivatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deactivatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await logAudit(req.user.id, "UPDATE", "User", deactivatedUser._id, req.ip);

    res.json({ message: "User deactivated successfully.", user: deactivatedUser });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate user.", error: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    // Vérification de sécurité : seul le propriétaire du compte ou un admin peut modifier
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own avatar." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: req.file.filename },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: "Failed to update avatar.", error: err.message });
  }
};