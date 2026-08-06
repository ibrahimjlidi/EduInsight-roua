// controllers/courseController.js
const Course = require("../models/Course");
const logAudit = require("../utils/auditLogger");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

exports.ajouterCourse = async (req, res) => {
  try {
    const nouveau = new Course({
      ...req.body,
      Teacher: req.user.role === "teacher" ? req.user.id : req.body.Teacher,
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
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = {};

    if (search) {
      filter.$or = [
        { Title: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } },
        { Level: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.teacher) {
      filter.Teacher = req.query.teacher;
    }

    let query = Course.find(filter)
      .populate("Department")
      .populate("Teacher", "firstName lastName email role")
      .sort({ createdAt: -1 });

    if (hasPagination) {
      query = query.skip(skip).limit(limit);
    }

    const [liste, total] = await Promise.all([
      query,
      hasPagination ? Course.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("courses", liste, total, page, limit));
    }

    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve courses.", error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const item = await Course.findById(req.params.id).populate("Department Teacher");
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
    if (req.user.role === "teacher") {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }
      if (String(course.Teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own courses." });
      }
    }

    const updateData = {
      ...req.body,
      ...(req.file ? { Image: req.file.filename } : {}),
    };

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
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
    if (req.user.role === "teacher") {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }
      if (String(course.Teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own courses." });
      }
    }

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
