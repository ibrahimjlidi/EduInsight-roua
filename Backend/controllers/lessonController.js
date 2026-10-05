// controllers/lessonController.js
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const Course = require("../models/Course");
const LessonProgress = require("../models/LessonProgress");

const canManageModule = async (req, moduleId) => {
  const module = await Module.findById(moduleId).select("course");
  if (!module) return { module: null, allowed: false };
  if (req.user.role === "admin") return { module, allowed: true };
  const course = await Course.findById(module.course).select("Teacher");
  return { module, allowed: Boolean(course && String(course.Teacher) === String(req.user.id)) };
};

exports.ajouterLesson = async (req, res) => {
  try {
    const { allowed } = await canManageModule(req, req.body.module);
    if (!allowed) return res.status(403).json({ message: "You can only add lessons to modules in your own courses." });
    const nouveau = new Lesson(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to create lesson.", error: err.message });
  }
};

exports.listerLessons = async (req, res) => {
  try {
    const liste = await Lesson.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve lessons.", error: err.message });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const item = await Lesson.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve lesson.", error: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const existing = await Lesson.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Lesson not found." });
    const source = await canManageModule(req, existing.module);
    const target = await canManageModule(req, req.body.module || existing.module);
    if (!source.allowed || !target.allowed) {
      return res.status(403).json({ message: "You can only update lessons in your own courses." });
    }
    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    if (String(existing.module) !== String(updated.module) || existing.Title !== updated.Title || existing.Content !== updated.Content) {
      await LessonProgress.deleteMany({ lesson: updated._id });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update lesson.", error: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const existing = await Lesson.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Lesson not found." });
    const { module, allowed } = await canManageModule(req, existing.module);
    if (!allowed) return res.status(403).json({ message: "You can only delete lessons from your own courses." });
    const deleted = await Lesson.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    await LessonProgress.deleteMany({ course: module.course, lesson: deleted._id });
    res.json({ message: "Lesson deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete lesson.", error: err.message });
  }
};