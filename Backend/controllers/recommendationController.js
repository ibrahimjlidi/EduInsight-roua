// controllers/recommendationController.js
const Recommendation = require("../models/Recommendation");
const Inscription = require("../models/Inscription");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const { createJsonCompletion, sendAiError } = require("../services/aiService");

exports.generatePersonalized = async (req, res) => {
  try {
    const studentId = req.user.id;
    const inscriptions = await Inscription.find({ student: studentId })
      .populate("course", "Title Level Description");
    const courseIds = inscriptions
      .map((item) => item.course?._id)
      .filter(Boolean);
    const [quizzes, attempts, availableCourses] = await Promise.all([
      Quiz.find({ course: { $in: courseIds }, isPublished: true })
        .select("Title course")
        .populate("course", "Title"),
      QuizAttempt.find({ student: studentId, submittedAt: { $ne: null } })
        .select("quiz score submittedAt")
        .populate({ path: "quiz", select: "Title course", populate: { path: "course", select: "Title" } })
        .sort({ submittedAt: -1 })
        .limit(30),
      Course.find({ _id: { $nin: courseIds } }).select("Title Level Description").limit(30),
    ]);

    const courseProgress = inscriptions
      .filter((enrollment) => enrollment.course)
      .map((enrollment) => {
      const course = enrollment.course;
      const courseQuizzes = quizzes.filter((quiz) => String(quiz.course?._id) === String(course._id));
      const courseAttempts = attempts.filter((attempt) => String(attempt.quiz?.course?._id) === String(course._id));
      const attemptedQuizIds = new Set(courseAttempts.map((attempt) => String(attempt.quiz?._id)));
      const averageScore = courseAttempts.length
        ? Math.round(courseAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / courseAttempts.length)
        : null;

      return {
        course: course.Title,
        level: course.Level || "unspecified",
        status: enrollment.status,
        progress: enrollment.status === "completed"
          ? 100
          : courseQuizzes.length
            ? Math.round((attemptedQuizIds.size / courseQuizzes.length) * 100)
            : 0,
        submittedQuizzes: attemptedQuizIds.size,
        publishedQuizzes: courseQuizzes.length,
        averageQuizScore: averageScore,
      };
      });

    const availableCourseTitles = new Set(availableCourses.map((course) => course.Title));
    const result = await createJsonCompletion({
      systemPrompt: `You are EduInsight's English-language learning coach. Generate up to three practical, supportive recommendations using only the supplied student's enrollment, published-quiz, and submitted-attempt data. Do not diagnose, shame, invent activity, or claim the student completed material not present in the data. Prefer concrete next steps. Recommend a course only if its exact title appears in availableCourses; otherwise use null. Return JSON only: {"recommendations":[{"title":"short title","message":"specific action","type":"practice|course|study_plan","confidenceScore":0.0,"courseTitle":null}]}. Include at least one helpful next step even when the student has no activity, and do not invent quiz/course titles.`,
      data: {
        courseProgress,
        recentSubmittedQuizAttempts: attempts.slice(0, 10).map((attempt) => ({
          quiz: attempt.quiz?.Title || "Quiz",
          course: attempt.quiz?.course?.Title || null,
          score: attempt.score ?? null,
          submittedAt: attempt.submittedAt,
        })),
        availableCourses: availableCourses.map((course) => ({
          title: course.Title,
          level: course.Level || null,
          description: course.Description || "",
        })),
      },
      maxTokens: 700,
    });

    if (!Array.isArray(result.recommendations)) {
      throw new Error("The AI provider returned an invalid recommendations response.");
    }

    const recommendations = result.recommendations
      .filter((item) => item && typeof item.title === "string" && typeof item.message === "string")
      .slice(0, 3)
      .map((item) => ({
        title: item.title.slice(0, 120),
        message: item.message.slice(0, 600),
        type: ["practice", "course", "study_plan"].includes(item.type) ? item.type : "study_plan",
        confidenceScore: Number.isFinite(item.confidenceScore)
          ? Math.min(1, Math.max(0, item.confidenceScore))
          : null,
        courseTitle: availableCourseTitles.has(item.courseTitle) ? item.courseTitle : null,
      }));

    if (!recommendations.length) {
      throw new Error("The AI provider did not return any usable recommendations.");
    }

    res.json({ recommendations });
  } catch (err) {
    return sendAiError(res, err, "Personalized recommendations failed");
  }
};

exports.ajouterRecommendation = async (req, res) => {
  try {
    const nouveau = new Recommendation({
      ...req.body,
      student: req.body.student || req.user.id,
    });
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add recommendation", error: err.message });
  }
};

exports.listerRecommendations = async (req, res) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user.id } : {};
    const liste = await Recommendation.find(filter);
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: err.message });
  }
};

exports.getRecommendationById = async (req, res) => {
  try {
    const item = await Recommendation.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    if (req.user.role !== "admin" && String(item.student) !== req.user.id) {
      return res.status(403).json({ message: "You can only access your own recommendations." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendation", error: err.message });
  }
};

exports.updateRecommendation = async (req, res) => {
  try {
    const updated = await Recommendation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update recommendation", error: err.message });
  }
};

exports.deleteRecommendation = async (req, res) => {
  try {
    const deleted = await Recommendation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json({ message: "Recommendation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete recommendation", error: err.message });
  }
};