// controllers/authController.js
const mongoose = require("mongoose");
const { randomBytes } = require("crypto");
const User = require("../models/User");
require("../models/Teacher");
require("../models/Student");
require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 8.1 Inscription (Register)
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role = "student" } = req.body;

  try {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim() ||
      !normalizedEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({ message: "First name, last name, email, and password are required." });
    }
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid account role." });
    }

    const userExiste = await User.findOne({ email: normalizedEmail });
    if (userExiste) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const Model = User.discriminators[role];
    const profile = role === "teacher"
      ? {
          speciality: typeof req.body.speciality === "string" ? req.body.speciality.trim() : "",
          office: typeof req.body.office === "string" ? req.body.office.trim() : "",
          department: req.body.department,
        }
      : {
          studentCode: `STU${randomBytes(3).toString("hex").toUpperCase()}`,
          level: req.body.level,
          department: req.body.department,
        };
    if (role === "teacher" && !profile.speciality) {
      return res.status(400).json({ message: "Speciality is required for teacher accounts." });
    }

    let nouvelUser;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        nouvelUser = await Model.create({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          ...profile,
        });
        break;
      } catch (error) {
        if (error.code !== 11000 || !error.keyPattern?.studentCode || attempt === 2) {
          throw error;
        }
        profile.studentCode = `STU${randomBytes(3).toString("hex").toUpperCase()}`;
      }
    }

    const safeUser = nouvelUser.toObject();
    delete safeUser.password;
    res.status(201).json({ message: "Registration successful", user: safeUser });
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
