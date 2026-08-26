// controllers/userController.js
const User = require("../models/User");
require("../models/Admin");
require("../models/Teacher");
require("../models/Student");
const bcrypt = require("bcryptjs");
const logAudit = require("../utils/auditLogger");
const createNotification = require("../utils/notification");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const allowedRoles = ["admin", "teacher", "student"];

const generateStudentCode = () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9);
  return `STU${suffix}`;
};

// Ajouter un utilisateur (admin uniquement)
exports.ajouterUtilisateur = async (req, res) => {
  try {
    const { password, role = "student", ...fields } = req.body;
    const safeRole = allowedRoles.includes(role) ? role : "student";
    const email = fields.email?.trim().toLowerCase();

    if (!fields.firstName || !fields.lastName || !email) {
      return res.status(400).json({ message: "First name, last name and email are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password || "Password123!", 10);
    const roleDefaults = {
      admin: { permissions: fields.permissions || ["MANAGE_PLATFORM"] },
      teacher: { speciality: fields.speciality || "General Teaching" },
      student: {
        studentCode: fields.studentCode || generateStudentCode(),
        level: fields.level || "L1",
      },
    };
    const Model = User.discriminators[safeRole] || User;

    delete fields.permissions;

    const nouvelUser = await Model.create({
      ...fields,
      ...roleDefaults[safeRole],
      email,
      password: hashedPassword,
    });

    await logAudit(req.user.id, "CREATE", "User", nouvelUser._id, req.ip);
    await createNotification({
      user: req.user.id,
      title: "User created",
      message: `${nouvelUser.firstName} ${nouvelUser.lastName} was added as ${nouvelUser.role}.`,
      type: "success",
    });

    const safeUser = nouvelUser.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(400).json({ message: "Failed to create user.", error: err.message });
  }
};

// Récupérer tous les utilisateurs
exports.listerUtilisateurs = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = {};

    if (req.query.includeInactive !== "true") {
      filter.isActive = { $ne: false };
    }

    if (req.query.isActive === "true") {
      filter.isActive = { $ne: false };
    }

    if (req.query.isActive === "false") {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    let query = User.find(filter).sort({ createdAt: -1 });
    if (hasPagination) {
      query = query.skip(skip).limit(limit);
    }

    const [users, total] = await Promise.all([
      query,
      hasPagination ? User.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("users", users, total, page, limit));
    }

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

    const updateData = { ...req.body };
    if (req.user.role !== "admin") {
      delete updateData.role;
      delete updateData.isActive;
      delete updateData.permissions;
    }

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: updateData.email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Another user already uses this email." });
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,          // retourne le document mis à jour
        runValidators: true // applique les validations du schema
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await logAudit(req.user.id, "UPDATE", "User", updatedUser._id, req.ip);

    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    res.json(safeUser);
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
