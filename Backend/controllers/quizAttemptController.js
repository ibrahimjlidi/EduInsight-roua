// controllers/quizAttemptController.js
const QuizAttempt = require("../models/QuizAttempt");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Choice = require("../models/Choice");
const Course = require("../models/Course");
const Answer = require("../models/Answer");
const Inscription = require("../models/Inscription");
const Certificate = require("../models/Certificate");
const createNotification = require("../utils/notification");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

exports.ajouterQuizAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.body.quiz);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    if (quiz.isPublished === false) {
      return res.status(403).json({ message: "This quiz is not published yet." });
    }

    const inscription = await Inscription.findOne({ student: req.user.id, course: quiz.course });
    if (!inscription) {
      return res.status(403).json({ message: "Enroll in the course before starting this quiz." });
    }

    const totalQuestions = await Question.countDocuments({ quiz: quiz._id });
    const nouveau = new QuizAttempt({
      student: req.user.id,
      quiz: quiz._id,
      totalQuestions,
      startedAt: new Date(),
      score: 0,
    });
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add quiz attempt", error: err.message });
  }
};

exports.listerQuizAttempts = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.user.role === "student") filter.student = req.user.id;
    if (req.query.student && req.user.role !== "student") filter.student = req.query.student;
    if (req.query.quiz) filter.quiz = req.query.quiz;

    if (req.user.role === "teacher") {
      const courses = await Course.find({ Teacher: req.user.id }).select("_id");
      const quizzes = await Quiz.find({ course: { $in: courses.map((course) => course._id) } }).select("_id");
      filter.quiz = filter.quiz
        ? { $in: quizzes.map((quiz) => quiz._id).filter((id) => String(id) === String(req.query.quiz)) }
        : { $in: quizzes.map((quiz) => quiz._id) };
    }

    let query = QuizAttempt.find(filter)
      .populate("student", "firstName lastName email role")
      .populate({
        path: "quiz",
        select: "Title course",
        populate: { path: "course", select: "Title" },
      })
      .sort({ submittedAt: -1, startedAt: -1 });

    if (hasPagination) query = query.skip(skip).limit(limit);

    const [attempts, total] = await Promise.all([
      query,
      hasPagination ? QuizAttempt.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("attempts", attempts, total, page, limit));
    }

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz attempts", error: err.message });
  }
};

exports.getQuizAttemptById = async (req, res) => {
  try {
    const item = await QuizAttempt.findById(req.params.id).populate({
      path: "quiz",
      select: "course Title",
      populate: { path: "course", select: "Teacher Title" },
    });
    if (!item) {
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé (err undefined enlevé)
    }
    const isOwner = String(item.student) === String(req.user.id);
    const isTeacherOwner = req.user.role === "teacher" && String(item.quiz?.course?.Teacher) === String(req.user.id);
    if (req.user.role !== "admin" && !isOwner && !isTeacherOwner) {
      return res.status(403).json({ message: "You cannot access this quiz attempt." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz attempt", error: err.message });
  }
};

exports.updateQuizAttempt = async (req, res) => {
  try {
    const updated = await QuizAttempt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update quiz attempt", error: err.message });
  }
};

exports.deleteQuizAttempt = async (req, res) => {
  try {
    const deleted = await QuizAttempt.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Quiz attempt not found" }); // ← corrigé
    }
    await Answer.deleteMany({ attempt: deleted._id });
    res.json({ message: "Quiz attempt deleted successfully" }); // ← corrigé (message succès faux avant)
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz attempt", error: err.message });
  }
};

// NOUVEAU — soumettre toutes les réponses d'un quiz en une seule requête
exports.submitAnswers = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // tableau de { questionId, selectedChoiceId, textAnswer }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }
    if (String(attempt.student) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only submit your own quiz attempt." });
    }

    const questions = await Question.find({ quiz: attempt.quiz });
    const questionMap = new Map(questions.map((question) => [String(question._id), question]));
    const validAnswers = Array.isArray(answers) ? answers : [];
    let earnedPoints = 0;
    const totalPoints = questions.reduce((sum, question) => sum + (question.Points || 0), 0);

    await Answer.deleteMany({ attempt: attempt._id });

    for (const item of validAnswers) {
      const question = questionMap.get(String(item.questionId));
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.Type === "MCQ" || question.Type === "TrueFalse") {
        const correctChoice = await Choice.findOne({ question: question._id, isCorrect: true });
        if (correctChoice && String(correctChoice._id) === String(item.selectedChoiceId)) {
          isCorrect = true;
          pointsEarned = question.Points || 0;
        }
      }

      earnedPoints += pointsEarned;

      await Answer.create({
        attempt: attempt._id,
        question: question._id,
        selectedChoice: item.selectedChoiceId,
        textAnswer: item.textAnswer,
        isCorrect,
        pointsEarned,
      });
    }

    const percentageScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    attempt.score = percentageScore;
    attempt.totalQuestions = questions.length;
    attempt.submittedAt = new Date();
    const startedAt = attempt.startedAt || attempt.createdAt || attempt.submittedAt;
    attempt.duration = Math.max(Math.floor((attempt.submittedAt - startedAt) / 1000), 0);
    await attempt.save();

    const quiz = await Quiz.findById(attempt.quiz);
    if (quiz && percentageScore >= 70) {
      const enrollment = await Inscription.findOneAndUpdate(
        { student: req.user.id, course: quiz.course },
        { status: "completed" },
        { new: true }
      );
      if (!enrollment) {
        return res.status(409).json({ message: "Course enrollment was not found; no certificate was issued." });
      }

      await Certificate.findOneAndUpdate(
        { student: req.user.id, course: quiz.course },
        {
          $setOnInsert: {
            student: req.user.id,
            course: quiz.course,
            quizAttempt: attempt._id,
            score: percentageScore,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      await createNotification({
        user: req.user.id,
        title: "Course completed",
        message: `Great job! Your quiz score unlocked a certificate.`,
        type: "success",
      });
    }

    res.status(200).json({
      message: "Answers submitted successfully",
      score: percentageScore,
      earnedPoints,
      totalPoints,
      attempt,
    });
  } catch (err) {
    res.status(400).json({ message: "Failed to submit answers", error: err.message });
  }
};
