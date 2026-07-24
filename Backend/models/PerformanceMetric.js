const mongoose = require("mongoose");

const performanceMetricSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  weekName: String,
  quizScoreAverage: Number,
  attendanceRate: Number,
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("PerformanceMetric", performanceMetricSchema);