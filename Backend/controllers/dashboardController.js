// controllers/dashboardController.js
const Inscription = require("../models/Inscription");
const QuizAttempt = require("../models/QuizAttempt");
const PerformanceMetric = require("../models/PerformanceMetric");
const Course = require("../models/Course");
const User = require("../models/User");
const Quiz = require("../models/Quiz");

const average = (items, getter) => {
  if (!items.length) return 0;
  return Math.round((items.reduce((sum, item) => sum + getter(item), 0) / items.length) * 100) / 100;
};

// Dashboard pour un étudiant connecté
exports.generateForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const inscriptions = await Inscription.find({ student: studentId });
    const totalCourses = inscriptions.length;

    const attempts = await QuizAttempt.find({ student: studentId });
    const averageScore = average(attempts, (attempt) => attempt.score || 0);

    const metrics = await PerformanceMetric.find({ student: studentId });
    const attendanceRate = average(metrics, (metric) => metric.attendanceRate || 0);

    const completed = inscriptions.filter((i) => i.status === "completed").length;
    const progress = totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0;
    const enrolledCourseIds = inscriptions.map((inscription) => inscription.course);
    const quizzes = await Quiz.find({ course: { $in: enrolledCourseIds }, isPublished: true }).populate("course");
    const gradeHistory = metrics.map((metric) => ({
      name: metric.weekName || "Start",
      score: metric.quizScoreAverage || 0,
    }));

    res.status(200).json({
      totalCourses,
      completedCourses: completed,
      averageScore,
      attendanceRate,
      progress,
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
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalCourses = await Course.countDocuments();
    const totalInscriptions = await Inscription.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const attempts = await QuizAttempt.find();
    const completedInscriptions = await Inscription.countDocuments({ status: "completed" });
    const activeCourses = await Course.countDocuments();
    const quizCompletion = totalQuizzes > 0 ? Math.min(Math.round((attempts.length / totalQuizzes) * 100), 100) : 0;
    const avgGrade = average(attempts, (attempt) => attempt.score || 0);
    const roleDistribution = [
      { name: "Students", value: totalStudents },
      { name: "Teachers", value: totalTeachers },
      { name: "Admins", value: Math.max(totalUsers - totalStudents - totalTeachers, 0) },
    ];
    const growth = await User.aggregate([
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
      userGrowth: growth.map((item) => ({
        name: monthNames[item._id.month - 1],
        users: item.users,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate admin dashboard.", error: err.message });
  }
};
