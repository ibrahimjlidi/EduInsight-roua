// utils/auditLogger.js
const AuditLog = require("../models/AuditLog");

const logAudit = async (userId, action, entity, entityId, ipAddress) => {
  try {
    await AuditLog.create({ user: userId, action, entity, entityId, ipAddress });
  } catch (err) {
    console.error("Erreur logAudit:", err.message);
  }
};

module.exports = logAudit;