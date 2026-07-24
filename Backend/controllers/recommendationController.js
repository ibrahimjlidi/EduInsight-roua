// controllers/recommendationController.js
const Recommendation = require("../models/Recommendation");

exports.ajouterRecommendation = async (req, res) => {
  try {
    const nouveau = new Recommendation(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add recommendation", error: err.message });
  }
};

exports.listerRecommendations = async (req, res) => {
  try {
    const liste = await Recommendation.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: err.message });
  }
};

exports.getRecommendationById = async (req, res) => {
  try {
    const item = await Recommendation.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendation", error: err.message });
  }
};

exports.updateRecommendation = async (req, res) => {
  try {
    const updated = await Recommendation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update recommendation", error: err.message });
  }
};

exports.deleteRecommendation = async (req, res) => {
  try {
    const deleted = await Recommendation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json({ message: "Recommendation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete recommendation", error: err.message });
  }
};