// controllers/questionController.js
const Question = require("../models/Question");

exports.ajouterQuestion = async (req, res) => {
  try {
    const nouveau = new Question(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add question", error: err.message });
  }
};

exports.listerQuestions = async (req, res) => {
  try {
    const liste = await Question.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions", error: err.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch question", error: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update question", error: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question", error: err.message });
  }
};