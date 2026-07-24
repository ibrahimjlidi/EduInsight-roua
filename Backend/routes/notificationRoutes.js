const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const protect = require("../middlewares/authMiddleware");

router.post("/ajouter", protect, notificationController.ajouterNotification);
router.get("/list", protect, notificationController.listerNotifications);
router.get("/:id", protect, notificationController.getNotificationById);
router.put("/:id", protect, notificationController.updateNotification);
router.delete("/:id", protect, notificationController.deleteNotification);

module.exports = router;