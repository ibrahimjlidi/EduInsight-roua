// controllers/quizAttemptController.js
const QuizAttempt = require("../models/QuizAttempt");

exports.ajouterQuizAttempt = async (req, res) => {
  try {
    const nouveau = new QuizAttempt(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add quiz attempt", error: err.message });
  }
};

exports.listerQuizAttempts = async (req, res) => {
  try {
    const liste = await QuizAttempt.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz attempts", error: err.message });
  }
};

exports.getQuizAttemptById = async (req, res) => {
  try {
    const item = await QuizAttempt.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Failed to fetch quiz attempt", error: err.message });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz attempt", error: err.message });
  }
};

exports.updateQuizAttempt = async (req, res) => {
  try {
    const updated = await QuizAttempt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Failed to update quiz attempt", error: err.message });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update quiz attempt", error: err.message });
  }
};

exports.deleteQuizAttempt = async (req, res) => {
  try {
    const deleted = await QuizAttempt.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Failed to delete quiz attempt", error: err.message });
    }
    res.json({ message: "Failed to delete quiz attempt", error: err.message });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz attempt", error: err.message });
  }
};