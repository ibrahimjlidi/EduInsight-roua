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
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const safeRole = "student";
    const Model = User.discriminators[safeRole] || User;

    const nouvelUser = await Model.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      ...extraFields, // ex: speciality/office/department pour teacher, studentCode/level pour student
    });

    res.status(201).json({ message: "Registration successful", user: nouvelUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8.2 Connexion (Login)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated." }); // ← ajouté (cohérent avec soft delete)
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
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
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// À ajouter dans controllers/authController.js
exports.logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};
