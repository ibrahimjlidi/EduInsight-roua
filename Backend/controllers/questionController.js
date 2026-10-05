// controllers/questionController.js
const Choice = require("../models/Choice");
const Course = require("../models/Course");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const teacherCanManageQuiz = async (req, quizId) => {
  if (req.user.role !== "teacher") return true;
  const quiz = await Quiz.findById(quizId).select("course");
  if (!quiz) return false;
  const course = await Course.findById(quiz.course).select("Teacher");
  return course && String(course.Teacher) === String(req.user.id);
};

exports.ajouterQuestion = async (req, res) => {
  try {
    if (!(await teacherCanManageQuiz(req, req.body.quiz))) {
      return res.status(403).json({ message: "You can only manage questions for your own quizzes." });
    }
    const nouveau = new Question(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add question", error: err.message });
  }
};

exports.listerQuestions = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = {};

    if (req.query.quiz) filter.quiz = req.query.quiz;
    if (search) {
      filter.Statement = { $regex: search, $options: "i" };
    }

    let query = Question.find(filter).populate("quiz", "Title").sort({ Order: 1, createdAt: 1 });
    if (hasPagination) query = query.skip(skip).limit(limit);

    const [questions, total] = await Promise.all([
      query,
      hasPagination ? Question.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("questions", questions, total, page, limit));
    }

    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions", error: err.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch question", error: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const existing = await Question.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (!(await teacherCanManageQuiz(req, req.body.quiz || existing.quiz))) {
      return res.status(403).json({ message: "You can only manage questions for your own quizzes." });
    }
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update question", error: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const existing = await Question.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (!(await teacherCanManageQuiz(req, existing.quiz))) {
      return res.status(403).json({ message: "You can only manage questions for your own quizzes." });
    }
    const choices = await Choice.find({ question: existing._id }).select("_id");
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    await Promise.all([
      Answer.updateMany({
        $or: [
          { question: deleted._id },
          { selectedChoice: { $in: choices.map((choice) => choice._id) } },
        ],
      }, { $unset: { question: 1, selectedChoice: 1 } }),
      Choice.deleteMany({ question: deleted._id }),
    ]);
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question", error: err.message });
  }
};
