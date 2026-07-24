// controllers/performanceMetricController.js
const PerformanceMetric = require("../models/PerformanceMetric");

exports.ajouterPerformanceMetric = async (req, res) => {
  try {
    const nouveau = new PerformanceMetric(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add performance metric", error: err.message });
  }
};

exports.listerPerformanceMetrics = async (req, res) => {
  try {
    const liste = await PerformanceMetric.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPerformanceMetricById = async (req, res) => {
  try {
    const item = await PerformanceMetric.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "PerformanceMetric not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch performance metric", error: err.message });
  }
};

exports.updatePerformanceMetric = async (req, res) => {
  try {
    const updated = await PerformanceMetric.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "PerformanceMetric not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update performance metric", error: err.message });
  }
};

exports.deletePerformanceMetric = async (req, res) => {
  try {
    const deleted = await PerformanceMetric.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "PerformanceMetric not found" });
    }
    res.json({ message: "PerformanceMetric deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete performance metric", error: err.message });
  }
};