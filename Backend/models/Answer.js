const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt" },
  question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  selectedChoice: { type: mongoose.Schema.Types.ObjectId, ref: "Choice" },
  textAnswer: String,
  isCorrect: Boolean,
  pointsEarned: Number,
});

module.exports = mongoose.model("Answer", answerSchema);