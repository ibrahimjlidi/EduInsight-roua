const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  score: Number,
  totalQuestions: Number,
  startedAt: Date,
  submittedAt: Date,
  duration: Number, 
});

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);