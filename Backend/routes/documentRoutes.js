const express = require("express");
const router = express.Router();
const c = require("../controllers/documentController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const uploadDocument = require("../middlewares/uploadDocument");

router.post("/", protect, authorize(["admin", "teacher"]), uploadDocument.single("file"), c.createDocument);
router.get("/list", protect, c.listDocuments);
router.put("/:id", protect, authorize(["admin", "teacher"]), c.updateDocument);
router.delete("/:id", protect, authorize(["admin", "teacher"]), c.deleteDocument);

module.exports = router;
