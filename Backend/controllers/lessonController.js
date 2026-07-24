// controllers/lessonController.js
const Lesson = require("../models/Lesson");

exports.ajouterLesson = async (req, res) => {
  try {
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
    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update lesson.", error: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const deleted = await Lesson.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    res.json({ message: "Lesson deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete lesson.", error: err.message });
  }
};