// controllers/quizAttemptController.js
const QuizAttempt = require("../models/QuizAttempt");
const Question = require("../models/Question");
const Choice = require("../models/Choice");
const Answer = require("../models/Answer");

exports.ajouterQuizAttempt = async (req, res) => {
  try {
    const nouveau = new QuizAttempt({
      ...req.body,
      student: req.user.id,
    });
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
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé (err undefined enlevé)
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
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé
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
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé
    }
    res.json({ message: "Quiz attempt deleted successfully" }); // ← corrigé (message succès faux avant)
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz attempt", error: err.message });
  }
};

// NOUVEAU — soumettre toutes les réponses d'un quiz en une seule requête
exports.submitAnswers = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // tableau de { questionId, selectedChoiceId, textAnswer }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    let totalScore = 0;

    for (const item of answers) {
      const question = await Question.findById(item.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.Type === "MCQ" || question.Type === "TrueFalse") {
        const correctChoice = await Choice.findOne({ question: question._id, isCorrect: true });
        if (correctChoice && String(correctChoice._id) === String(item.selectedChoiceId)) {
          isCorrect = true;
          pointsEarned = question.Points || 0;
        }
      }

      totalScore += pointsEarned;

      await Answer.create({
        attempt: attempt._id,
        question: question._id,
        selectedChoice: item.selectedChoiceId,
        textAnswer: item.textAnswer,
        isCorrect,
        pointsEarned,
      });
    }

    attempt.score = totalScore;
    attempt.submittedAt = new Date();
    attempt.duration = Math.floor((attempt.submittedAt - attempt.startedAt) / 1000);
    await attempt.save();

    res.status(200).json({ message: "Answers submitted successfully", score: totalScore, attempt });
  } catch (err) {
    res.status(400).json({ message: "Failed to submit answers", error: err.message });
  }
};