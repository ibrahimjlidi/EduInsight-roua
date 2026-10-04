const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  quizAttempt: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt", required: true },
  certificateCode: {
    type: String,
    required: true,
    unique: true,
    default: () => `EI-${randomUUID().toUpperCase()}`,
  },
  score: { type: Number, min: 0, max: 100, required: true },
  issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
