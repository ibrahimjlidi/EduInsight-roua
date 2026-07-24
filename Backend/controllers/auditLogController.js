// controllers/auditLogController.js
const AuditLog = require("../models/AuditLog");

exports.ajouterAuditLog = async (req, res) => {
  try {
    const nouveau = new AuditLog(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Erreur d'ajout", error: err.message });
  }
};

exports.listerAuditLogs = async (req, res) => {
  try {
    const liste = await AuditLog.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const item = await AuditLog.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "AuditLog non trouvé(e)" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: err.message });
  }
};

exports.updateAuditLog = async (req, res) => {
  try {
    const updated = await AuditLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "AuditLog non trouvé(e)" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Erreur de mise à jour", error: err.message });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    const deleted = await AuditLog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "AuditLog non trouvé(e)" });
    }
    res.json({ message: "AuditLog supprimé(e) avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur de suppression", error: err.message });
  }
};