// controllers/choiceController.js
const Choice = require("../models/Choice");
const Course = require("../models/Course");
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const teacherCanManageQuestion = async (req, questionId) => {
  if (req.user.role !== "teacher") return true;
  const question = await Question.findById(questionId).select("quiz");
  if (!question) return false;
  const quiz = await Quiz.findById(question.quiz).select("course");
  if (!quiz) return false;
  const course = await Course.findById(quiz.course).select("Teacher");
  return course && String(course.Teacher) === String(req.user.id);
};

exports.ajouterChoice = async (req, res) => {
  try {
    if (!(await teacherCanManageQuestion(req, req.body.question))) {
      return res.status(403).json({ message: "You can only manage choices for your own questions." });
    }
    const nouveau = new Choice(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add choice", error: err.message });
  }
};

exports.listerChoices = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.question) filter.question = req.query.question;

    let query = Choice.find(filter)
      .select(req.user.role === "student" ? "-isCorrect" : "")
      .populate("question", "Statement")
      .sort({ Order: 1, createdAt: 1 });
    if (hasPagination) query = query.skip(skip).limit(limit);

    const [choices, total] = await Promise.all([
      query,
      hasPagination ? Choice.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("choices", choices, total, page, limit));
    }

    res.json(choices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch choices", error: err.message });
  }
};

exports.getChoiceById = async (req, res) => {
  try {
    const item = await Choice.findById(req.params.id).select(req.user.role === "student" ? "-isCorrect" : "");
    if (!item) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch choice", error: err.message });
  }
};

exports.updateChoice = async (req, res) => {
  try {
    const existing = await Choice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Choice not found" });
    }
    if (!(await teacherCanManageQuestion(req, req.body.question || existing.question))) {
      return res.status(403).json({ message: "You can only manage choices for your own questions." });
    }
    const updated = await Choice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update choice", error: err.message });
  }
};

exports.deleteChoice = async (req, res) => {
  try {
    const existing = await Choice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Choice not found" });
    }
    if (!(await teacherCanManageQuestion(req, existing.question))) {
      return res.status(403).json({ message: "You can only manage choices for your own questions." });
    }
    const deleted = await Choice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json({ message: "Choice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete choice", error: err.message });
  }
};
