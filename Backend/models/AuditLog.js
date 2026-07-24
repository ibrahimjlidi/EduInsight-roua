const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId,
  ipAddress: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog", auditLogSchema);