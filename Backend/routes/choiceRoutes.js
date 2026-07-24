const express = require("express");
const router = express.Router();
const choiceController = require("../controllers/choiceController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["teacher", "admin"]), choiceController.ajouterChoice);
router.get("/list", protect, choiceController.listerChoices);
router.get("/:id", protect, choiceController.getChoiceById);
router.put("/:id", protect, authorize(["teacher", "admin"]), choiceController.updateChoice);
router.delete("/:id", protect, authorize(["teacher", "admin"]), choiceController.deleteChoice);

module.exports = router;