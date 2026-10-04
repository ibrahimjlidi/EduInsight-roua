const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const certificateController = require("../controllers/certificateController");

router.get("/mine", protect, authorize(["student"]), certificateController.listMine);

module.exports = router;
