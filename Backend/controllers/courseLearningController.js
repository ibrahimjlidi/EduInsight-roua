const Course = require("../models/Course");
const Inscription = require("../models/Inscription");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const Module = require("../models/Module");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Certificate = require("../models/Certificate");
const Document = require("../models/Document");
const { getFinalQuiz, sortQuizzes } = require("../services/courseQuizUtils");

const getEnrolledStudent = async (studentId, courseId) => {
  const [course, enrollment] = await Promise.all([
    Course.findById(courseId).populate("Teacher", "firstName lastName"),
    Inscription.findOne({ student: studentId, course: courseId }),
  ]);
  return { course, enrollment };
};

exports.getCourseLearning = async (req, res) => {
  try {
    const { course, enrollment } = await getEnrolledStudent(req.user.id, req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (!enrollment || enrollment.status === "dropped") {
      return res.status(403).json({ message: "Enroll in this course to access its lessons." });
    }

    const modules = await Module.find({ course: course._id }).sort({ Order: 1, createdAt: 1 });
    const [lessons, progressRecords, quizzes, certificate, resources] = await Promise.all([
      Lesson.find({ module: { $in: modules.map((module) => module._id) } }).sort({ Order: 1, createdAt: 1 }),
      LessonProgress.find({ student: req.user.id, course: course._id }),
      Quiz.find({ course: course._id, isPublished: true }).sort({ Order: 1, createdAt: 1 }),
      Certificate.findOne({ student: req.user.id, course: course._id }),
      Document.find({ course: course._id, audience: { $in: ["all", "student"] } })
        .select("title description fileName originalName mimeType size createdAt")
        .sort({ createdAt: -1 }),
    ]);
    const currentLessonIds = new Set(lessons.map((lesson) => String(lesson._id)));
    const currentProgressRecords = progressRecords.filter((record) => currentLessonIds.has(String(record.lesson)));
    const progressByLesson = new Map(currentProgressRecords.map((record) => [String(record.lesson), record]));
    const orderedQuizzes = sortQuizzes(quizzes);
    const finalQuiz = getFinalQuiz(orderedQuizzes);
    const attempts = await QuizAttempt.find({ student: req.user.id, quiz: { $in: quizzes.map((quiz) => quiz._id) } })
      .select("quiz score submittedAt")
      .sort({ submittedAt: -1 });
    const courseLessons = lessons.map((lesson) => {
      const progress = progressByLesson.get(String(lesson._id));
      return {
        ...lesson.toObject(),
        isCompleted: Boolean(progress),
        completedAt: progress?.completedAt || null,
      };
    });

    res.json({
      course: course.toObject(),
      enrollment: { status: enrollment.status, enrolledAt: enrollment.enrolledAt },
      modules: modules.map((module) => ({
        ...module.toObject(),
        lessons: courseLessons.filter((lesson) => String(lesson.module) === String(module._id)),
      })),
      progress: {
        completedLessons: currentProgressRecords.length,
        totalLessons: lessons.length,
        percentage: lessons.length ? Math.round((currentProgressRecords.length / lessons.length) * 100) : 0,
        lessonsComplete: lessons.length === currentProgressRecords.length,
      },
      quizzes: orderedQuizzes.map((quiz) => ({
        _id: quiz._id,
        Title: quiz.Title,
        Description: quiz.Description,
        Duration: quiz.Duration,
        Order: quiz.Order,
        isFinal: String(quiz._id) === String(finalQuiz?._id),
        latestScore: attempts.find((attempt) => String(attempt.quiz) === String(quiz._id))?.score ?? null,
      })),
      certificate: certificate ? {
        certificateCode: certificate.certificateCode,
        issuedAt: certificate.issuedAt,
        score: certificate.score,
      } : null,
      resources,
    });
  } catch (err) {
    console.error("Failed to load course learning content:", err.message);
    res.status(500).json({ message: "Failed to load course learning content." });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const { course, enrollment } = await getEnrolledStudent(req.user.id, req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (!enrollment || enrollment.status === "dropped") {
      return res.status(403).json({ message: "Enroll in this course to track lesson progress." });
    }

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found." });

    const module = await Module.findOne({ _id: lesson.module, course: course._id });
    if (!module) return res.status(404).json({ message: "Lesson does not belong to this course." });

    const progress = await LessonProgress.findOneAndUpdate(
      { student: req.user.id, lesson: lesson._id },
      { $setOnInsert: { student: req.user.id, course: course._id, lesson: lesson._id } },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Lesson progress saved.",
      lessonId: lesson._id,
      completedAt: progress.completedAt,
    });
  } catch (err) {
    console.error("Failed to save lesson progress:", err.message);
    res.status(500).json({ message: "Failed to save lesson progress." });
  }
};
