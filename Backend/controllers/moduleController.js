// controllers/moduleController.js
const Module = require("../models/Module");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const logAudit = require("../utils/auditLogger");

const canManageCourse = async (req, courseId) => {
  if (req.user.role === "admin") return true;
  const course = await Course.findById(courseId).select("Teacher");
  return Boolean(course && String(course.Teacher) === String(req.user.id));
};

exports.ajouterModule = async (req, res) => {
  try {
    if (!(await canManageCourse(req, req.body.course))) {
      return res.status(403).json({ message: "You can only add modules to your own courses." });
    }
    const nouveau = new Module(req.body);
    await nouveau.save();
    await logAudit(req.user.id, "CREATE", "Module", nouveau._id, req.ip);
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to create module.", error: err.message });
  }
};

exports.listerModules = async (req, res) => {
  try {
    const liste = await Module.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve modules.", error: err.message });
  }
};

exports.getModuleById = async (req, res) => {
  try {
    const item = await Module.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Module not found." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve module.", error: err.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const existing = await Module.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Module not found." });
    if (req.body.course && String(req.body.course) !== String(existing.course)) {
      return res.status(400).json({ message: "Move a module by creating it in the destination course instead." });
    }
    if (!(await canManageCourse(req, existing.course))) {
      return res.status(403).json({ message: "You can only update modules in your own courses." });
    }
    const updated = await Module.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Module not found." });
    }
    await logAudit(req.user.id, "UPDATE", "Module", updated._id, req.ip);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update module.", error: err.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const existing = await Module.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Module not found." });
    if (!(await canManageCourse(req, existing.course))) {
      return res.status(403).json({ message: "You can only delete modules from your own courses." });
    }
    const deleted = await Module.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Module not found." });
    }
    const lessons = await Lesson.find({ module: deleted._id }).select("_id");
    const lessonIds = lessons.map((lesson) => lesson._id);
    await Promise.all([
      Lesson.deleteMany({ _id: { $in: lessonIds } }),
      LessonProgress.deleteMany({ course: deleted.course, lesson: { $in: lessonIds } }),
    ]);
    await logAudit(req.user.id, "DELETE", "Module", deleted._id, req.ip);
    res.json({ message: "Module deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete module.", error: err.message });
  }
};
