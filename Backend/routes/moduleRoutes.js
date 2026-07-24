const express = require("express");
const router = express.Router();
const moduleController = require("../controllers/moduleController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), moduleController.ajouterModule);
router.get("/list", protect, moduleController.listerModules);
router.get("/:id", protect, moduleController.getModuleById);
router.put("/:id", protect, authorize(["teacher", "admin"]), moduleController.updateModule);
router.delete("/:id", protect, authorize(["teacher", "admin"]), moduleController.deleteModule);

module.exports = router;