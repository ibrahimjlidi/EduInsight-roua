const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), questionController.ajouterQuestion);
router.get("/list", protect, questionController.listerQuestions);
router.get("/:id", protect, questionController.getQuestionById);
router.put("/:id", protect, authorize(["teacher", "admin"]), questionController.updateQuestion);
router.delete("/:id", protect, authorize(["teacher", "admin"]), questionController.deleteQuestion);

module.exports = router;