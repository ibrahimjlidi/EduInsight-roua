const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answerController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["student"]), answerController.ajouterAnswer);
router.get("/list", protect, authorize(["teacher", "admin"]), answerController.listerAnswers);
router.get("/:id", protect, answerController.getAnswerById);
router.put("/:id", protect, answerController.updateAnswer);
router.delete("/:id", protect, authorize(["admin"]), answerController.deleteAnswer);

module.exports = router;