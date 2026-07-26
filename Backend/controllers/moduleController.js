// controllers/moduleController.js
const Module = require("../models/Module");

exports.ajouterModule = async (req, res) => {
  try {
    const nouveau = new Module(req.body);
    await nouveau.save();
    await logAudit(req.user.id, "CREATE", "Module", nouveau._id, req.ip);
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to create module.", error: err.message });
  }
};

exports.listerModules = async (req, res) => {
  try {
    const liste = await Module.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve modules.", error: err.message });
  }
};

exports.getModuleById = async (req, res) => {
  try {
    const item = await Module.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Module not found." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve module.", error: err.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const updated = await Module.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Module not found." });
    }
    await logAudit(req.user.id, "UPDATE", "Module", updated._id, req.ip);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update module.", error: err.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const deleted = await Module.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Module not found." });
    }
    await logAudit(req.user.id, "DELETE", "Module", deleted._id, req.ip);
    res.json({ message: "Module deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete module.", error: err.message });
  }
};