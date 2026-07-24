const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), quizController.ajouterQuiz);
router.get("/list", protect, quizController.listerQuizzes);
router.get("/:id", protect, quizController.getQuizById);
router.put("/:id", protect, authorize(["teacher", "admin"]), quizController.updateQuiz);
router.delete("/:id", protect, authorize(["teacher", "admin"]), quizController.deleteQuiz);

module.exports = router;