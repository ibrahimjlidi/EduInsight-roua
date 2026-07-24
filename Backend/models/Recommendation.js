const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  type: String,
  confidenceScore: Number,
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("Recommendation", recommendationSchema);