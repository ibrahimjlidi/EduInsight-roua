// controllers/courseController.js
const Course = require("../models/Course");
const Answer = require("../models/Answer");
const Choice = require("../models/Choice");
const Document = require("../models/Document");
const Inscription = require("../models/Inscription");
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const LessonProgress = require("../models/LessonProgress");
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const logAudit = require("../utils/auditLogger");
const createNotification = require("../utils/notification");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const getUploadedFile = (req, fieldName) => {
  if (req.files?.[fieldName]?.[0]) return req.files[fieldName][0];
  if (req.file?.fieldname === fieldName) return req.file;
  return null;
};

exports.ajouterCourse = async (req, res) => {
  try {
    const imageFile = getUploadedFile(req, "Image");
    const pdfFile = getUploadedFile(req, "Pdf");
    const nouveau = new Course({
      ...req.body,
      Teacher: req.user.role === "teacher" ? req.user.id : req.body.Teacher,
      Image: imageFile ? imageFile.filename : req.body.Image,
      Pdf: pdfFile ? pdfFile.filename : req.body.Pdf,
    });
    await nouveau.save();

    await logAudit(req.user.id, "CREATE", "Course", nouveau._id, req.ip);
    await createNotification({
      user: req.user.id,
      title: "Course saved",
      message: `${nouveau.Title} was added to the platform.`,
      type: "course",
      link: req.user.role === "teacher" ? "/teacher/courses" : "/admin/courses",
    });

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
      ...(getUploadedFile(req, "Image") ? { Image: getUploadedFile(req, "Image").filename } : {}),
      ...(getUploadedFile(req, "Pdf") ? { Pdf: getUploadedFile(req, "Pdf").filename } : {}),
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

    const [modules, quizzes] = await Promise.all([
      Module.find({ course: deleted._id }).select("_id"),
      Quiz.find({ course: deleted._id }).select("_id"),
    ]);
    const moduleIds = modules.map((module) => module._id);
    const quizIds = quizzes.map((quiz) => quiz._id);
    const questions = await Question.find({ quiz: { $in: quizIds } }).select("_id");
    const questionIds = questions.map((question) => question._id);
    const attempts = await QuizAttempt.find({ quiz: { $in: quizIds } }).select("_id");
    const attemptIds = attempts.map((attempt) => attempt._id);

    await Promise.all([
      Lesson.deleteMany({ module: { $in: moduleIds } }),
      LessonProgress.deleteMany({ course: deleted._id }),
      Module.deleteMany({ course: deleted._id }),
      Choice.deleteMany({ question: { $in: questionIds } }),
      Question.deleteMany({ quiz: { $in: quizIds } }),
      Answer.deleteMany({ attempt: { $in: attemptIds } }),
      QuizAttempt.deleteMany({ quiz: { $in: quizIds } }),
      Quiz.deleteMany({ course: deleted._id }),
      Inscription.deleteMany({ course: deleted._id }),
      Document.updateMany({ course: deleted._id }, { $unset: { course: "" } }),
    ]);

    await logAudit(req.user.id, "DELETE", "Course", deleted._id, req.ip);
    
    res.json({ message: "Course deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course.", error: err.message });
  }
};
