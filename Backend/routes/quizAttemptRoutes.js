const express = require("express");
const router = express.Router();
const c = require("../controllers/quizAttemptController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["student"]), c.ajouterQuizAttempt);
router.get("/list", protect, authorize(["teacher", "admin"]), c.listerQuizAttempts);
router.get("/:id", protect, c.getQuizAttemptById);
router.put("/:id", protect, c.updateQuizAttempt);
router.delete("/:id", protect, authorize(["admin"]), c.deleteQuizAttempt);

module.exports = router;