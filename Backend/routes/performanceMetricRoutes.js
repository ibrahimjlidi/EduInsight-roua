const express = require("express");
const router = express.Router();
const performanceMetricController = require("../controllers/performanceMetricController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), performanceMetricController.ajouterPerformanceMetric);
router.get("/list", protect, performanceMetricController.listerPerformanceMetrics);
router.get("/:id", protect, performanceMetricController.getPerformanceMetricById);
router.put("/:id", protect, authorize(["teacher", "admin"]), performanceMetricController.updatePerformanceMetric);
router.delete("/:id", protect, authorize(["admin"]), performanceMetricController.deletePerformanceMetric);

module.exports = router;