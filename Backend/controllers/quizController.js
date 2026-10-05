// controllers/quizController.js
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Choice = require("../models/Choice");
const QuizAttempt = require("../models/QuizAttempt");
const Answer = require("../models/Answer");
const Course = require("../models/Course");
const Inscription = require("../models/Inscription");
const logAudit = require("../utils/auditLogger");
const createNotification = require("../utils/notification");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");
const { getFinalQuizForCourse, getCourseLessonCompletion } = require("../services/courseQuizUtils");

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
      Order: Number.isInteger(Number(req.body.Order)) ? Number(req.body.Order) : 1,
      isFinal: req.body.isFinal === true || req.body.isFinal === "true",
    });
    await nouveau.save();
    if (nouveau.isFinal) {
      await Quiz.updateMany(
        { course: nouveau.course, _id: { $ne: nouveau._id } },
        { $set: { isFinal: false } }
      );
    }

    await logAudit(req.user.id, "CREATE", "Quiz", nouveau._id, req.ip);
    await createNotification({
      user: req.user.id,
      title: "Quiz created",
      message: `${nouveau.Title} is ready for assessment.`,
      type: "quiz",
      link: req.user.role === "teacher" ? "/teacher/quizzes" : "/admin/quizzes",
    });

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

    if (req.user.role === "student") {
      const courseIds = [...new Set(
        quizzes
          .map((quiz) => quiz.course?._id || quiz.course)
          .filter(Boolean)
          .map(String)
      )];
      const enrollments = await Inscription.find({
        student: req.user.id,
        course: { $in: courseIds },
        status: { $ne: "dropped" },
      }).select("course");
      const enrolledCourseIds = new Set(enrollments.map((item) => String(item.course)));
      const courseReadiness = new Map(await Promise.all(courseIds.map(async (courseId) => {
        const completion = await getCourseLessonCompletion(req.user.id, courseId);
        return [courseId, completion.lessonsComplete];
      })));

      payload.forEach((quiz) => {
        const courseId = String(quiz.course?._id || quiz.course || "");
        quiz.canTake = quiz.isPublished !== false
          && enrolledCourseIds.has(courseId)
          && courseReadiness.get(courseId) === true;
        quiz.lockReason = quiz.isPublished === false
          ? "This quiz has not been published yet."
          : !enrolledCourseIds.has(courseId)
            ? "Enroll in this course to unlock the quiz."
            : !quiz.canTake
              ? "Complete all course lessons to unlock the quiz."
              : "";
      });
    }

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

exports.getQuizForTaking = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate({
      path: "course",
      populate: { path: "Teacher", select: "firstName lastName email role" },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (req.user.role === "student") {
      if (quiz.isPublished === false) {
        return res.status(403).json({ message: "This quiz is not published yet." });
      }
      const inscription = await Inscription.findOne({ student: req.user.id, course: quiz.course?._id || quiz.course });
      if (!inscription || inscription.status === "dropped") {
        return res.status(403).json({ message: "Enroll in the course before taking this quiz." });
      }
      const lessonCompletion = await getCourseLessonCompletion(req.user.id, quiz.course?._id || quiz.course);
      if (!lessonCompletion.lessonsComplete) {
        return res.status(403).json({ message: "Complete all course lessons before taking its quizzes." });
      }
    }

    if (req.user.role === "teacher" && String(quiz.course?.Teacher?._id || quiz.course?.Teacher) !== req.user.id) {
      return res.status(403).json({ message: "You can only preview quizzes from your own courses." });
    }

    const questions = await Question.find({ quiz: quiz._id }).sort({ Order: 1, createdAt: 1 });
    const finalQuiz = await getFinalQuizForCourse(quiz.course?._id || quiz.course);
    const choices = await Choice.find({ question: { $in: questions.map((question) => question._id) } })
      .select("question Text Order")
      .sort({ Order: 1, createdAt: 1 });
    const choiceMap = new Map();

    choices.forEach((choice) => {
      const key = String(choice.question);
      choiceMap.set(key, [...(choiceMap.get(key) || []), choice]);
    });

    res.json({
      ...quiz.toObject(),
      isFinalQuiz: String(finalQuiz?._id) === String(quiz._id),
      questions: questions.map((question) => ({
        ...question.toObject(),
        choices: choiceMap.get(String(question._id)) || [],
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz content", error: err.message });
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
      {
        ...req.body,
        ...(req.body.Order !== undefined ? { Order: Number(req.body.Order) } : {}),
        ...(req.body.isFinal !== undefined ? { isFinal: req.body.isFinal === true || req.body.isFinal === "true" } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Failed to find quiz" });
    }
    if (updated.isFinal) {
      await Quiz.updateMany(
        { course: updated.course, _id: { $ne: updated._id } },
        { $set: { isFinal: false } }
      );
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

    const questions = await Question.find({ quiz: deleted._id }).select("_id");
    const questionIds = questions.map((question) => question._id);
    const attempts = await QuizAttempt.find({ quiz: deleted._id }).select("_id");
    const attemptIds = attempts.map((attempt) => attempt._id);

    await Promise.all([
      Choice.deleteMany({ question: { $in: questionIds } }),
      Question.deleteMany({ quiz: deleted._id }),
      Answer.deleteMany({ attempt: { $in: attemptIds } }),
      QuizAttempt.deleteMany({ quiz: deleted._id }),
    ]);

    await logAudit(req.user.id, "DELETE", "Quiz", deleted._id, req.ip);
    
    res.json({ message: "Quiz deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete quiz", error: err.message });
  }
};
