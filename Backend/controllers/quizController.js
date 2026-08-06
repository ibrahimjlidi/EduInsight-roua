// controllers/quizController.js
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Course = require("../models/Course");
const logAudit = require("../utils/auditLogger");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

exports.ajouterQuiz = async (req, res) => {
  try {
    if (req.user.role === "teacher") {
      const course = await Course.findById(req.body.course);
      if (!course || String(course.Teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only create quizzes for your own courses." });
      }
    }

    const nouveau = new Quiz({
      ...req.body,
      createdBy: req.user.id,
    });
    await nouveau.save();

    await logAudit(req.user.id, "CREATE", "Quiz", nouveau._id, req.ip);

    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add quiz", error: err.message });
  }
};

exports.listerQuizzes = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = {};

    if (search) {
      filter.$or = [
        { Title: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.course) {
      filter.course = req.query.course;
    }

    if (req.query.teacher) {
      const courses = await Course.find({ Teacher: req.query.teacher }).select("_id");
      filter.course = { $in: courses.map((course) => course._id) };
    }

    let query = Quiz.find(filter)
      .populate({
        path: "course",
        populate: { path: "Teacher", select: "firstName lastName email role" },
      })
      .populate("createdBy", "firstName lastName email role")
      .sort({ createdAt: -1 });

    if (hasPagination) {
      query = query.skip(skip).limit(limit);
    }

    const [quizzes, total] = await Promise.all([
      query,
      hasPagination ? Quiz.countDocuments(filter) : Promise.resolve(0),
    ]);

    const questionCounts = await Question.aggregate([
      { $match: { quiz: { $in: quizzes.map((quiz) => quiz._id) } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(questionCounts.map((item) => [String(item._id), item.count]));

    const payload = quizzes.map((quiz) => ({
        ...quiz.toObject(),
        questionCount: countMap.get(String(quiz._id)) || 0,
      }));

    if (hasPagination) {
      return res.json(buildPaginationResponse("quizzes", payload, total, page, limit));
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quizzes", error: err.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const item = await Quiz.findById(req.params.id).populate("course createdBy");
    if (!item) {
      return res.status(404).json({ message: "Failed to find quiz" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz", error: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    if (req.user.role === "teacher") {
      const quiz = await Quiz.findById(req.params.id).populate("course");
      if (!quiz) {
        return res.status(404).json({ message: "Failed to find quiz" });
      }
      if (String(quiz.course?.Teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only update quizzes from your own courses." });
      }
    }

    const updated = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Failed to find quiz" });
    }

    await logAudit(req.user.id, "UPDATE", "Quiz", updated._id, req.ip);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update quiz", error: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    if (req.user.role === "teacher") {
      const quiz = await Quiz.findById(req.params.id).populate("course");
      if (!quiz) {
        return res.status(404).json({ message: "Failed to find quiz" });
      }
      if (String(quiz.course?.Teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only delete quizzes from your own courses." });
      }
    }

    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Failed to find quiz" });
    }

    await logAudit(req.user.id, "DELETE", "Quiz", deleted._id, req.ip);
    
    res.json({ message: "Quiz deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz", error: err.message });
  }
};
