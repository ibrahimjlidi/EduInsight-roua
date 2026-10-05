const mongoose = require("mongoose");

const lessonProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("LessonProgress", lessonProgressSchema);
