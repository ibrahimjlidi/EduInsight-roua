// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login,logout } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const courseController = require("../controllers/courseController");


router.post("/register", register);
router.post("/login", login);

router.post("/ajouterCourse", protect, courseController.ajouterCourse);

router.get("/list", protect, authorize(["admin", "teacher"]), (req, res) => {
  res.json({ message: "User Profile", user: req.user });
});

router.get("/admin", protect, authorize(["admin"]), (req, res) => {
  res.json({ message: "Administrator Area" });
});

router.post("/logout", protect, logout); 

module.exports = router;