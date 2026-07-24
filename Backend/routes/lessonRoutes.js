const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), lessonController.ajouterLesson);
router.get("/list", protect, lessonController.listerLessons);
router.get("/:id", protect, lessonController.getLessonById);
router.put("/:id", protect, authorize(["teacher", "admin"]), lessonController.updateLesson);
router.delete("/:id", protect, authorize(["teacher", "admin"]), lessonController.deleteLesson);

module.exports = router;