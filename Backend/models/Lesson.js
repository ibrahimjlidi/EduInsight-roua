// models/Lesson.js
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  Title: String,
  Content: String,
  VideoUrl: String,
  PdfUrl: String,
  Order: Number,
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("Lesson", lessonSchema);