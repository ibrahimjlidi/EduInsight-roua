// controllers/recommendationController.js
const Recommendation = require("../models/Recommendation");
const Inscription = require("../models/Inscription");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const { createJsonCompletion, sendAiError } = require("../services/aiService");

exports.generatePersonalized = async (req, res) => {
  try {
    const studentId = req.user.id;
    const inscriptions = await Inscription.find({ student: studentId })
      .populate("course", "Title Level Description");
    const courseIds = inscriptions
      .map((item) => item.course?._id)
      .filter(Boolean);
    const [quizzes, attempts, availableCourses, modules] = await Promise.all([
      Quiz.find({ course: { $in: courseIds }, isPublished: true })
        .select("Title course isFinal")
        .populate("course", "Title"),
      QuizAttempt.find({ student: studentId, submittedAt: { $ne: null } })
        .select("quiz score submittedAt")
        .populate({ path: "quiz", select: "Title course", populate: { path: "course", select: "Title" } })
        .sort({ submittedAt: -1 })
        .limit(30),
      Course.find({ _id: { $nin: courseIds } }).select("Title Level Description").limit(30),
      Module.find({ course: { $in: courseIds } }).select("Title course"),
    ]);
    const moduleIds = modules.map((module) => module._id);
    const [lessons, lessonProgress] = await Promise.all([
      Lesson.find({ module: { $in: moduleIds } }).select("Title module"),
      LessonProgress.find({ student: studentId, course: { $in: courseIds } }).select("course lesson"),
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
        lessonTitles: lessons
          .filter((lesson) => modules.some((module) => String(module.course) === String(course._id)
            && String(module._id) === String(lesson.module)))
          .map((lesson) => lesson.Title),
        publishedQuizTitles: courseQuizzes.map((quiz) => quiz.Title),
        averageQuizScore: averageScore,
      };
      });

    const courseTargets = new Map();
    inscriptions.forEach((enrollment) => {
      if (enrollment.course && ["active", "completed"].includes(enrollment.status)) {
        courseTargets.set(enrollment.course.Title, {
          course: enrollment.course,
          enrolled: true,
        });
      }
    });
    availableCourses.forEach((course) => {
      if (!courseTargets.has(course.Title)) {
        courseTargets.set(course.Title, { course, enrolled: false });
      }
    });
    const firstCourseTarget = courseTargets.values().next().value;
    const result = await createJsonCompletion({
      systemPrompt: `You are EduInsight's English-language learning coach. Generate up to three practical, supportive recommendations using only the supplied student's enrollment, published-quiz, and submitted-attempt data. Do not diagnose, shame, invent activity, or claim the student completed material not present in the data. Prefer concrete next steps. Every recommendation must name an exact course title from enrolledCourses or availableCourses in courseTitle. When recommending a specific lesson or quiz, also set lessonTitle or quizTitle to its exact title from the matching enrolled course; otherwise set those fields to null. Prefer enrolled courses for practice and study plans; recommend an available course only when suggesting a new course. Return JSON only: {"recommendations":[{"title":"short title","message":"specific action","type":"practice|course|study_plan","confidenceScore":0.0,"courseTitle":"exact supplied course title","lessonTitle":null,"quizTitle":null}]}. Include at least one helpful next step even when the student has no quiz activity, and do not invent quiz, course, or lesson titles.`,
      data: {
        enrolledCourses: courseProgress,
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
      maxTokens: 2048,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "personalized_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    type: { type: "string", enum: ["practice", "course", "study_plan"] },
                    confidenceScore: { type: "number" },
                    courseTitle: { type: ["string", "null"] },
                    lessonTitle: { type: ["string", "null"] },
                    quizTitle: { type: ["string", "null"] },
                  },
                  required: ["title", "message", "type", "confidenceScore", "courseTitle", "lessonTitle", "quizTitle"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    if (!Array.isArray(result.recommendations)) {
      throw new Error("The AI provider returned an invalid recommendations response.");
    }

    const recommendations = result.recommendations
      .filter((item) => item && typeof item.title === "string" && typeof item.message === "string")
      .slice(0, 3)
      .map((item) => {
        const target = courseTargets.get(item.courseTitle) || firstCourseTarget;
        const courseId = String(target?.course._id || "");
        const targetLesson = item.lessonTitle && target?.enrolled
          ? lessons.find((lesson) => (
            lesson.Title === item.lessonTitle
            && modules.some((module) => String(module.course) === courseId && String(module._id) === String(lesson.module))
          ))
          : null;
        const targetQuiz = item.quizTitle && target?.enrolled
          ? quizzes.find((quiz) => String(quiz.course?._id) === courseId && quiz.Title === item.quizTitle)
          : null;
        const courseLessons = lessons.filter((lesson) => (
          modules.some((module) => String(module.course) === courseId && String(module._id) === String(lesson.module))
        ));
        const completedLessonIds = new Set(
          lessonProgress
            .filter((record) => String(record.course) === courseId)
            .map((record) => String(record.lesson))
        );
        const allLessonsComplete = courseLessons.length > 0
          && courseLessons.every((lesson) => completedLessonIds.has(String(lesson._id)));
        const actionUrl = targetLesson
          ? `/student/courses/${courseId}/learn?lessonId=${targetLesson._id}#lesson-reader`
          : targetQuiz
            ? allLessonsComplete
              ? `/student/quizzes/${targetQuiz._id}`
              : `/student/courses/${courseId}/learn#course-quizzes`
            : target
              ? target.enrolled
                ? `/student/courses/${courseId}/learn`
                : `/student/courses?search=${encodeURIComponent(target.course.Title)}&recommended=${courseId}`
              : "/student/courses";
        return {
          title: item.title.slice(0, 120),
          message: item.message.slice(0, 600),
          type: ["practice", "course", "study_plan"].includes(item.type) ? item.type : "study_plan",
          confidenceScore: Number.isFinite(item.confidenceScore)
            ? Math.min(1, Math.max(0, item.confidenceScore))
            : null,
          courseTitle: target?.course.Title || null,
          lessonTitle: targetLesson?.Title || null,
          quizTitle: targetQuiz?.Title || null,
          actionUrl,
          actionLabel: targetLesson
            ? `Open lesson: ${targetLesson.Title}`
            : targetQuiz
              ? allLessonsComplete ? `Take quiz: ${targetQuiz.Title}` : `Go to quiz: ${targetQuiz.Title}`
              : target
                ? target.enrolled ? "Open recommended course" : "Find recommended course"
                : "Browse courses",
        };
      });

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