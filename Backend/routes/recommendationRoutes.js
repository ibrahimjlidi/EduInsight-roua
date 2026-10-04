const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.get("/personalized", protect, authorize(["student"]), recommendationController.generatePersonalized);
router.post("/ajouter", protect, authorize(["admin"]), recommendationController.ajouterRecommendation);
router.get("/list", protect, authorize(["admin"]), recommendationController.listerRecommendations);
router.get("/:id", protect, recommendationController.getRecommendationById);
router.put("/:id", protect, authorize(["admin"]), recommendationController.updateRecommendation);
router.delete("/:id", protect, authorize(["admin"]), recommendationController.deleteRecommendation);

module.exports = router;