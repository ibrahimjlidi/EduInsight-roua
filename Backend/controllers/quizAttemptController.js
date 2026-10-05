// controllers/quizAttemptController.js
const QuizAttempt = require("../models/QuizAttempt");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Choice = require("../models/Choice");
const Course = require("../models/Course");
const Answer = require("../models/Answer");
const Inscription = require("../models/Inscription");
const Certificate = require("../models/Certificate");
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const { getFinalQuizForCourse, getCourseLessonCompletion } = require("../services/courseQuizUtils");
const { createJsonCompletion, sendAiError } = require("../services/aiService");
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

    if (inscription.status === "dropped") {
      return res.status(403).json({ message: "Re-enroll in this course before starting its quizzes." });
    }

    const lessonCompletion = await getCourseLessonCompletion(req.user.id, quiz.course);
    if (!lessonCompletion.lessonsComplete) {
      return res.status(403).json({ message: "Complete all course lessons before taking its quizzes." });
    }

    const finalQuiz = await getFinalQuizForCourse(quiz.course);
    const isFinalQuiz = String(finalQuiz?._id) === String(quiz._id);

    const totalQuestions = await Question.countDocuments({ quiz: quiz._id });
    const nouveau = new QuizAttempt({
      student: req.user.id,
      quiz: quiz._id,
      totalQuestions,
      startedAt: new Date(),
      score: 0,
    });
    await nouveau.save();
    res.status(201).json({ ...nouveau.toObject(), isFinalQuiz });
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
    if (attempt.submittedAt) {
      return res.status(409).json({ message: "This quiz attempt has already been submitted. Start a new attempt to retry." });
    }
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz || quiz.isPublished === false) {
      return res.status(404).json({ message: "This quiz is no longer available." });
    }
    const enrollment = await Inscription.findOne({
      student: req.user.id,
      course: quiz.course,
      status: { $ne: "dropped" },
    });
    if (!enrollment) {
      return res.status(403).json({ message: "An active course enrollment is required to submit this quiz." });
    }
    const lessonCompletion = await getCourseLessonCompletion(req.user.id, quiz.course);
    if (!lessonCompletion.lessonsComplete) {
      return res.status(403).json({ message: "Complete all course lessons before submitting its quizzes." });
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

    const finalQuiz = await getFinalQuizForCourse(quiz.course);
    const isFinalQuiz = String(finalQuiz?._id) === String(quiz?._id);
    const passed = percentageScore >= 70;
    let courseCompleted = false;
    let certificate = null;

    if (quiz && passed && isFinalQuiz) {
      const activeEnrollment = await Inscription.findOneAndUpdate(
        { student: req.user.id, course: quiz.course, status: { $ne: "dropped" } },
        { status: "completed" },
        { new: true }
      );
      if (!activeEnrollment) {
        return res.status(409).json({ message: "Active course enrollment was not found; no certificate was issued." });
      }

      certificate = await Certificate.findOneAndUpdate(
        { student: req.user.id, course: quiz.course },
        {
          $setOnInsert: {
            student: req.user.id,
            course: quiz.course,
            quizAttempt: attempt._id,
            score: percentageScore,
          },
        },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
      );
      courseCompleted = true;

    }

    const resultLink = courseCompleted
      ? "/student/certificates"
      : passed
        ? `/student/courses/${quiz.course}/learn`
        : "/student/recommendations";
    await createNotification({
      user: req.user.id,
      title: courseCompleted ? "Certificate earned" : passed ? "Quiz passed" : "Study plan ready",
      message: courseCompleted
        ? "Congratulations! You passed the final quiz and earned your course certificate."
        : passed
          ? `You scored ${percentageScore}% on ${quiz.Title}. Continue learning toward your certificate.`
          : `You scored ${percentageScore}% on ${quiz.Title}. Review your recommendations before trying again.`,
      type: courseCompleted || passed ? "success" : "info",
      link: resultLink,
    });

    res.status(200).json({
      message: "Answers submitted successfully",
      score: percentageScore,
      earnedPoints,
      totalPoints,
      attempt,
      passed,
      isFinalQuiz,
      courseCompleted,
      certificate: certificate ? {
        certificateCode: certificate.certificateCode,
        issuedAt: certificate.issuedAt,
        score: certificate.score,
      } : null,
    });
  } catch (err) {
    res.status(400).json({ message: "Failed to submit answers", error: err.message });
  }
};

exports.getAttemptFeedback = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate({ path: "quiz", select: "Title course", populate: { path: "course", select: "Title Description" } });
    if (!attempt) return res.status(404).json({ message: "Quiz attempt not found." });
    if (String(attempt.student) !== req.user.id) {
      return res.status(403).json({ message: "You can only review your own quiz attempt." });
    }
    if (!attempt.submittedAt) {
      return res.status(409).json({ message: "Submit the quiz before requesting study feedback." });
    }
    if (attempt.score >= 70) {
      return res.status(400).json({ message: "Study feedback is available for attempts below 70%." });
    }

    const answers = await Answer.find({ attempt: attempt._id, isCorrect: false })
      .populate("question", "Statement Type Points");
    const quiz = attempt.quiz;
    const courseId = quiz?.course?._id;
    const modules = courseId ? await Module.find({ course: courseId }).select("Title Description") : [];
    const moduleIds = await Module.find({ course: courseId }).distinct("_id");
    const lessons = await Lesson.find({ module: { $in: moduleIds } }).select("Title Content").limit(30);
    const result = await createJsonCompletion({
      systemPrompt: `You are a supportive EduInsight course tutor. Give the student clear, actionable English feedback based only on the supplied quiz questions and course lessons. Explain what to review without revealing answer keys, guessing which option was correct, or claiming unprovided facts. Be encouraging; state their score accurately; suggest re-taking the quiz after revision. Return JSON only: {"summary":"brief supportive feedback mentioning the supplied score","focusAreas":[{"topic":"topic directly supported by a wrong question","explanation":"helpful explanation grounded in the provided lesson content","reviewAction":"specific lesson or practice action"}],"recommendedNextStep":"one concise action"}. Return up to three focus areas and do not invent lesson titles.`,
      data: {
        course: { title: quiz?.course?.Title || "Course", description: quiz?.course?.Description || "" },
        quizTitle: quiz?.Title || "Quiz",
        score: attempt.score,
        passingScore: 70,
        courseModules: modules,
        lessons: lessons.map((lesson) => ({
          title: lesson.Title,
          content: (lesson.Content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 1500),
        })),
        questionsToReview: answers
          .filter((answer) => answer.question)
          .map((answer) => ({
            question: answer.question.Statement,
            type: answer.question.Type,
            points: answer.question.Points,
          })),
      },
      maxTokens: 600,
    });

    if (typeof result.summary !== "string" || !Array.isArray(result.focusAreas)) {
      throw new Error("The AI provider returned an invalid study feedback response.");
    }

    res.json({
      summary: result.summary.slice(0, 800),
      focusAreas: result.focusAreas
        .filter((area) => area && typeof area.topic === "string" && typeof area.explanation === "string")
        .slice(0, 3)
        .map((area) => ({
          topic: area.topic.slice(0, 120),
          explanation: area.explanation.slice(0, 500),
          reviewAction: typeof area.reviewAction === "string" ? area.reviewAction.slice(0, 300) : "",
        })),
      recommendedNextStep: typeof result.recommendedNextStep === "string"
        ? result.recommendedNextStep.slice(0, 400)
        : "Review your course lessons and try the quiz again.",
    });
  } catch (err) {
    return sendAiError(res, err, "Quiz study feedback failed");
  }
};
