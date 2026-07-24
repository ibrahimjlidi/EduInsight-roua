const express = require("express");
const router = express.Router();
const c = require("../controllers/auditLogController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["admin"]), c.ajouterAuditLog);
router.get("/list", protect, authorize(["admin"]), c.listerAuditLogs);
router.get("/:id", protect, authorize(["admin"]), c.getAuditLogById);
router.put("/:id", protect, authorize(["admin"]), c.updateAuditLog);
router.delete("/:id", protect, authorize(["admin"]), c.deleteAuditLog);

module.exports = router;