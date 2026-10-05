const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const controller = require("../controllers/courseContentController");

const router = express.Router();
const contentManagers = [protect, authorize(["admin", "teacher"])];

router.get("/:courseId/content", ...contentManagers, controller.getCourseContent);
router.post("/:courseId/modules", ...contentManagers, controller.createModule);
router.put("/:courseId/modules/:moduleId", ...contentManagers, controller.updateModule);
router.delete("/:courseId/modules/:moduleId", ...contentManagers, controller.deleteModule);
router.post("/:courseId/modules/:moduleId/lessons", ...contentManagers, controller.createLesson);
router.put("/:courseId/modules/:moduleId/lessons/:lessonId", ...contentManagers, controller.updateLesson);
router.delete("/:courseId/modules/:moduleId/lessons/:lessonId", ...contentManagers, controller.deleteLesson);

module.exports = router;
