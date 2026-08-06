// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.get("/student", protect, authorize(["student"]), dashboardController.generateForStudent);
router.get("/teacher", protect, authorize(["teacher"]), dashboardController.generateForTeacher);
router.get("/admin", protect, authorize(["admin"]), dashboardController.generateForAdmin);

module.exports = router;