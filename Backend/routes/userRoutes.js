// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const uploadAvatar = require("../middlewares/uploadAvatar");

router.get("/list", protect, authorize(["admin"]), userController.listerUtilisateurs);
router.get("/:id", protect, userController.getUtilisateurById);
router.put("/:id", protect, userController.updateUtilisateur);
router.put("/:id/avatar", protect, uploadAvatar.single("avatar"), userController.updateAvatar);
router.delete("/:id", protect, authorize(["admin"]), userController.deleteUtilisateur);

module.exports = router;