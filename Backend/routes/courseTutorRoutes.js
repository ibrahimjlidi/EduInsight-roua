const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const courseTutorController = require("../controllers/courseTutorController");

router.post("/:courseId/tutor", protect, authorize(["student"]), courseTutorController.askCourseTutor);

module.exports = router;
