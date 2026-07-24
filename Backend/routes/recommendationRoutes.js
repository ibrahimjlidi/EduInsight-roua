const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const protect = require("../middlewares/authMiddleware");

router.post("/ajouter", protect, recommendationController.ajouterRecommendation);
router.get("/list", protect, recommendationController.listerRecommendations);
router.get("/:id", protect, recommendationController.getRecommendationById);
router.put("/:id", protect, recommendationController.updateRecommendation);
router.delete("/:id", protect, recommendationController.deleteRecommendation);

module.exports = router;