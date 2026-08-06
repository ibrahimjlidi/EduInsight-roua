const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/upload"); 

router.post("/ajouter",protect,authorize(["admin", "teacher"]),upload.single("Image"), courseController.ajouterCourse);
router.get("/list", courseController.listerCourses);
router.get("/:id", courseController.getCourseById);
router.put("/:id", protect, authorize(["admin", "teacher"]), upload.single("Image"), courseController.updateCourse);
router.delete("/:id", protect, authorize(["admin", "teacher"]), courseController.deleteCourse);

module.exports = router;
