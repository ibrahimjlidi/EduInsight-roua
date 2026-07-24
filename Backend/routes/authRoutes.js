// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const courController = require("../controllers/courseController");

router.post("/register", register);
router.post("/login", login);

router.post("/ajouterCour", protect, courController.ajouterCourse);

router.get("/list", protect, authorize(["admin", "teacher"]), (req, res) => {
  res.json({ message: "Profil utilisateur", user: req.user });
});

router.get("/admin", protect, authorize(["admin"]), (req, res) => {
  res.json({ message: "Espace administrateur" });
});

module.exports = router;