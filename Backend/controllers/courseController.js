// controllers/courseController.js
const Course = require("../models/Course");

exports.ajouterCourse = async (req, res) => {
  try {
    const nouveau = new Course({
      ...req.body,
      Teacher: req.user.id, 
      Image: req.file ? req.file.filename : req.body.Image, // ← seul ajout
    });
    await nouveau.save();

    await logAudit(req.user.id, "CREATE", "Course", nouveau._id, req.ip);

    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to create course.", error: err.message });
  }
};

exports.listerCourses = async (req, res) => {
  try {
    const liste = await Course.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve courses.", error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const item = await Course.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve course.", error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Course not found." });
    }

    await logAudit(req.user.id, "UPDATE", "Course", updated._id, req.ip);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update course.", error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Course not found." });
    }

    await logAudit(req.user.id, "DELETE", "Course", deleted._id, req.ip);
    
    res.json({ message: "Course deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course.", error: err.message });
  }
};