// controllers/answerController.js
const Answer = require("../models/Answer");

exports.ajouterAnswer = async (req, res) => {
  try {
    const nouveau = new Answer(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add answer", error: err.message });
  }
};

exports.listerAnswers = async (req, res) => {
  try {
    const liste = await Answer.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch answers", error: err.message });
  }
};

exports.getAnswerById = async (req, res) => {
  try {
    const item = await Answer.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Answer not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch answer", error: err.message });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const updated = await Answer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Answer not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update answer", error: err.message });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const deleted = await Answer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Answer not found" });
    }
    res.json({ message: "Answer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete answer", error: err.message });
  }
};