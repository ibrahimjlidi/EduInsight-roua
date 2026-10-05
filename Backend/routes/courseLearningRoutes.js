const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const courseLearningController = require("../controllers/courseLearningController");

router.get("/:courseId/learning", protect, authorize(["student"]), courseLearningController.getCourseLearning);
router.post("/:courseId/lessons/:lessonId/progress", protect, authorize(["student"]), courseLearningController.completeLesson);

module.exports = router;
