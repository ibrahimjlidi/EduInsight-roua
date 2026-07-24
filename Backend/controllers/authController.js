// controllers/authController.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("../models/Teacher");
require("../models/Student");
require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 8.1 Inscription (Register)
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role, ...extraFields } = req.body;

  try {
    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return res.status(400).json({ message: "Utilisateur déjà existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Choisit le bon modèle (discriminator) selon le rôle
    const Model = User.discriminators[role] || User;

    const nouvelUser = await Model.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      ...extraFields, // ex: speciality/office/department pour teacher, studentCode/level pour student
    });

    res.status(201).json({ message: "Inscription réussie", user: nouvelUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8.2 Connexion (Login)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Identifiants invalides" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};