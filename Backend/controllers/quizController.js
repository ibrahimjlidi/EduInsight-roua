// controllers/quizController.js
const Quiz = require("../models/Quiz");

exports.ajouterQuiz = async (req, res) => {
  try {
    const nouveau = new Quiz({
      ...req.body,
      createdBy: req.user.id,
    });
    await nouveau.save();

    await logAudit(req.user.id, "CREATE", "Quiz", nouveau._id, req.ip);

    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add quiz", error: err.message });
  }
};

exports.listerQuizzes = async (req, res) => {
  try {
    const liste = await Quiz.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quizzes", error: err.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const item = await Quiz.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Failed to find quiz", error: err.message });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz", error: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Failed to find quiz", error: err.message });
    }

    await logAudit(req.user.id, "UPDATE", "Quiz", updated._id, req.ip);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update quiz", error: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Failed to find quiz", error: err.message });
    }

    await logAudit(req.user.id, "DELETE", "Quiz", deleted._id, req.ip);
    
    res.json({ message: "Quiz deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz", error: err.message });
  }
};