// controllers/dashboardController.js
const Inscription = require("../models/Inscription");
const QuizAttempt = require("../models/QuizAttempt");
const PerformanceMetric = require("../models/PerformanceMetric");
const Course = require("../models/Course");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const { createJsonCompletion, sendAiError } = require("../services/aiService");

const average = (items, getter) => {
  if (!items.length) return 0;
  return Math.round((items.reduce((sum, item) => sum + getter(item), 0) / items.length) * 100) / 100;
};

// Dashboard pour un étudiant connecté
exports.generateForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const inscriptions = await Inscription.find({ student: studentId })
      .populate("course", "Title");
    const totalCourses = inscriptions.length;

    const attempts = await QuizAttempt.find({ student: studentId, submittedAt: { $ne: null } })
      .populate({ path: "quiz", select: "course", populate: { path: "course", select: "Title" } });
    const averageScore = average(attempts, (attempt) => attempt.score || 0);

    const metrics = await PerformanceMetric.find({ student: studentId });
    const attendanceRate = average(metrics, (metric) => metric.attendanceRate || 0);

    const completed = inscriptions.filter((i) => i.status === "completed").length;
    const enrolledCourseIds = inscriptions.map((inscription) => inscription.course?._id).filter(Boolean);
    const quizzes = await Quiz.find({ course: { $in: enrolledCourseIds }, isPublished: true }).populate("course");
    const gradeHistory = metrics.map((metric) => ({
      name: metric.weekName || "Start",
      score: metric.quizScoreAverage || 0,
    }));
    const courseProgress = inscriptions
      .filter((inscription) => inscription.course)
      .map((inscription) => {
        const courseId = String(inscription.course._id);
        const courseQuizzes = quizzes.filter((quiz) => String(quiz.course?._id || quiz.course) === courseId);
        const courseAttempts = attempts.filter((attempt) => (
          String(attempt.quiz?.course?._id || attempt.quiz?.course || "") === courseId
        ));
        const attemptedQuizIds = new Set(courseAttempts.map((attempt) => String(attempt.quiz?._id || attempt.quiz)));
        const score = courseAttempts.length
          ? average(courseAttempts, (attempt) => attempt.score || 0)
          : null;

        return {
          courseId,
          courseTitle: inscription.course.Title,
          status: inscription.status,
          progress: inscription.status === "completed"
            ? 100
            : courseQuizzes.length
              ? Math.round((attemptedQuizIds.size / courseQuizzes.length) * 100)
              : 0,
          completedQuizzes: attemptedQuizIds.size,
          totalQuizzes: courseQuizzes.length,
          averageScore: score,
        };
      });
    const progress = courseProgress.length
      ? Math.round(courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length)
      : 0;

    res.status(200).json({
      totalCourses,
      completedCourses: completed,
      averageScore,
      attendanceRate,
      progress,
      courseProgress,
      quizzes: quizzes.map((quiz) => ({
        id: quiz._id,
        title: quiz.Title,
        courseTitle: quiz.course?.Title,
        courseId: quiz.course?._id,
      })),
      gradeHistory,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate student dashboard.", error: err.message });
  }
};

exports.generateAdminAiInsights = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      activeStudents,
      totalStudents,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      recentEnrollments,
      attemptSummary,
      coursePerformance,
    ] = await Promise.all([
      User.countDocuments({ role: "student", isActive: { $ne: false } }),
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Inscription.countDocuments(),
      Inscription.countDocuments({ status: "completed" }),
      Inscription.countDocuments({ enrolledAt: { $gte: since } }),
      QuizAttempt.aggregate([
        { $match: { submittedAt: { $ne: null } } },
        {
          $group: {
            _id: null,
            submittedAttempts: { $sum: 1 },
            averageScore: { $avg: "$score" },
            lowScores: { $sum: { $cond: [{ $lt: ["$score", 60] }, 1, 0] } },
          },
        },
      ]),
      QuizAttempt.aggregate([
        { $match: { submittedAt: { $ne: null } } },
        { $lookup: { from: "quizzes", localField: "quiz", foreignField: "_id", as: "quiz" } },
        { $unwind: "$quiz" },
        { $lookup: { from: "courses", localField: "quiz.course", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        {
          $group: {
            _id: "$course._id",
            courseTitle: { $first: "$course.Title" },
            attempts: { $sum: 1 },
            averageScore: { $avg: "$score" },
            lowScores: { $sum: { $cond: [{ $lt: ["$score", 60] }, 1, 0] } },
          },
        },
        { $sort: { averageScore: 1 } },
        { $limit: 8 },
      ]),
    ]);

    const attempts = attemptSummary[0] || { submittedAttempts: 0, averageScore: 0, lowScores: 0 };
    const result = await createJsonCompletion({
      systemPrompt: `You are an education analytics assistant for EduInsight administrators. Analyze only the supplied aggregate platform metrics. These are descriptive signals, not proof of causation. Do not identify or infer anything about individual students. If there is little data, state that limitation and suggest what to monitor. Return concise, actionable English JSON only in this shape: {"summary":"one or two sentences","insights":[{"title":"short heading","description":"evidence-based observation and actionable next step","priority":"high|medium|low"}]}. Return at most four insights and never invent numbers.`,
      data: {
        activeStudents,
        totalStudents,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0,
        enrollmentsInLast30Days: recentEnrollments,
        submittedQuizAttempts: attempts.submittedAttempts,
        averageSubmittedQuizScore: Math.round(attempts.averageScore || 0),
        submittedAttemptsBelow60: attempts.lowScores,
        coursePerformance: coursePerformance.map((course) => ({
          course: course.courseTitle,
          submittedAttempts: course.attempts,
          averageScore: Math.round(course.averageScore || 0),
          attemptsBelow60: course.lowScores,
        })),
      },
      maxTokens: 800,
    });

    if (typeof result.summary !== "string" || !Array.isArray(result.insights)) {
      throw new Error("The AI provider returned an invalid analytics response.");
    }

    res.json({
      summary: result.summary.slice(0, 1000),
      insights: result.insights
        .filter((item) => item && typeof item.title === "string" && typeof item.description === "string")
        .slice(0, 4)
        .map((item) => ({
          title: item.title.slice(0, 120),
          description: item.description.slice(0, 600),
          priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "low",
        })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return sendAiError(res, err, "Admin AI analytics failed");
  }
};

// Dashboard pour un enseignant connecté
exports.generateForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const courses = await Course.find({ Teacher: teacherId });
    const courseIds = courses.map((c) => c._id);

    const inscriptions = await Inscription.find({ course: { $in: courseIds } });
    const totalStudents = new Set(inscriptions.map((i) => String(i.student))).size;
    const quizzes = await Quiz.find({ course: { $in: courseIds } });
    const attempts = await QuizAttempt.find({ quiz: { $in: quizzes.map((quiz) => quiz._id) } });

    res.status(200).json({
      totalCourses: courses.length,
      totalStudents,
      totalQuizzes: quizzes.length,
      avgQuizScore: average(attempts, (attempt) => attempt.score || 0),
      courses: courses.map((c) => ({ id: c._id, title: c.Title, level: c.Level, duration: c.Duration })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate teacher dashboard.", error: err.message });
  }
};

// Dashboard pour un admin connecté
exports.generateForAdmin = async (req, res) => {
  try {
    const activeUserFilter = { isActive: { $ne: false } };
    const totalUsers = await User.countDocuments(activeUserFilter);
    const totalStudents = await User.countDocuments({ ...activeUserFilter, role: "student" });
    const totalTeachers = await User.countDocuments({ ...activeUserFilter, role: "teacher" });
    const totalCourses = await Course.countDocuments();
    const totalInscriptions = await Inscription.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const attempts = await QuizAttempt.find();
    const completedInscriptions = await Inscription.countDocuments({ status: "completed" });
    const activeInscriptions = await Inscription.countDocuments({ status: "active" });
    const droppedInscriptions = await Inscription.countDocuments({ status: "dropped" });
    const activeCourses = await Course.countDocuments();
    const quizCompletion = totalQuizzes > 0 ? Math.min(Math.round((attempts.length / totalQuizzes) * 100), 100) : 0;
    const avgGrade = average(attempts, (attempt) => attempt.score || 0);
    const gradeDistribution = [
      { name: "A", value: attempts.filter((attempt) => (attempt.score || 0) >= 90).length },
      { name: "B", value: attempts.filter((attempt) => (attempt.score || 0) >= 80 && (attempt.score || 0) < 90).length },
      { name: "C", value: attempts.filter((attempt) => (attempt.score || 0) >= 70 && (attempt.score || 0) < 80).length },
      { name: "D", value: attempts.filter((attempt) => (attempt.score || 0) >= 60 && (attempt.score || 0) < 70).length },
      { name: "F", value: attempts.filter((attempt) => (attempt.score || 0) < 60).length },
    ];
    const possibleEnrollments = totalCourses * totalStudents;
    const notStarted = Math.max(possibleEnrollments - totalInscriptions, 0);
    const courseCompletion = [
      { name: "Completed", value: completedInscriptions },
      { name: "In Progress", value: activeInscriptions },
      { name: "Dropped", value: droppedInscriptions },
      { name: "Not Started", value: notStarted },
    ];
    const roleDistribution = [
      { name: "Students", value: totalStudents },
      { name: "Teachers", value: totalTeachers },
      { name: "Admins", value: Math.max(totalUsers - totalStudents - totalTeachers, 0) },
    ];
    const growth = await User.aggregate([
      { $match: activeUserFilter },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          users: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    res.status(200).json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalInscriptions,
      totalQuizzes,
      activeCourses,
      quizCompletion,
      avgGrade,
      completionRate: totalInscriptions > 0 ? Math.round((completedInscriptions / totalInscriptions) * 100) : 0,
      roleDistribution,
      gradeDistribution,
      courseCompletion,
      userGrowth: growth.map((item) => ({
        name: monthNames[item._id.month - 1],
        users: item.users,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate admin dashboard.", error: err.message });
  }
};
