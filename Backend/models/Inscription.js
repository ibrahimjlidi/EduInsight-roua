const mongoose = require("mongoose");

const inscriptionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "completed", "dropped"], default: "active" },
});

module.exports = mongoose.model("Inscription", inscriptionSchema);