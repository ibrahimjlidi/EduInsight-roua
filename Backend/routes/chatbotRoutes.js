// routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const protect = require("../middlewares/authMiddleware");

router.post("/message", protect, chatbotController.sendMessage);

module.exports = router;