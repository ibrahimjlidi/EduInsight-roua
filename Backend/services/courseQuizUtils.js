const Quiz = require("../models/Quiz");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");

const sortQuizzes = (quizzes) => [...quizzes].sort((left, right) => (
  (left.Order || 0) - (right.Order || 0)
  || new Date(left.createdAt || 0) - new Date(right.createdAt || 0)
  || String(left._id).localeCompare(String(right._id))
));

const getFinalQuiz = (quizzes) => {
  const orderedQuizzes = sortQuizzes(quizzes);
  return orderedQuizzes.filter((quiz) => quiz.isFinal).at(-1)
    || orderedQuizzes.at(-1)
    || null;
};

const getFinalQuizForCourse = async (courseId) => {
  const quizzes = await Quiz.find({ course: courseId, isPublished: true });
  return getFinalQuiz(quizzes);
};

const getCourseLessonCompletion = async (studentId, courseId) => {
  const moduleIds = await Module.find({ course: courseId }).distinct("_id");
  const lessonIds = await Lesson.find({ module: { $in: moduleIds } }).distinct("_id");
  const completedLessonIds = await LessonProgress.find({
    student: studentId,
    course: courseId,
    lesson: { $in: lessonIds },
  }).distinct("lesson");

  return {
    completedLessons: completedLessonIds.length,
    totalLessons: lessonIds.length,
    lessonsComplete: lessonIds.length > 0 && completedLessonIds.length === lessonIds.length,
  };
};

module.exports = { sortQuizzes, getFinalQuiz, getFinalQuizForCourse, getCourseLessonCompletion };
