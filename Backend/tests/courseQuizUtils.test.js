const assert = require("node:assert/strict");
const { test } = require("node:test");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const Module = require("../models/Module");
const { getCourseLessonCompletion } = require("../services/courseQuizUtils");

test("a course with no lessons is not considered ready for quizzes", async () => {
  const originals = {
    moduleFind: Module.find,
    lessonFind: Lesson.find,
    progressFind: LessonProgress.find,
  };
  Module.find = () => ({ distinct: async () => [] });
  Lesson.find = () => ({ distinct: async () => [] });
  LessonProgress.find = () => ({ distinct: async () => [] });

  try {
    const completion = await getCourseLessonCompletion("student-1", "course-1");
    assert.equal(completion.totalLessons, 0);
    assert.equal(completion.lessonsComplete, false);
  } finally {
    Module.find = originals.moduleFind;
    Lesson.find = originals.lessonFind;
    LessonProgress.find = originals.progressFind;
  }
});

test("a course is ready for quizzes only after every lesson is complete", async () => {
  const originals = {
    moduleFind: Module.find,
    lessonFind: Lesson.find,
    progressFind: LessonProgress.find,
  };
  Module.find = () => ({ distinct: async () => ["module-1"] });
  Lesson.find = () => ({ distinct: async () => ["lesson-1", "lesson-2"] });
  LessonProgress.find = () => ({ distinct: async () => ["lesson-1", "lesson-2"] });

  try {
    const completion = await getCourseLessonCompletion("student-1", "course-1");
    assert.equal(completion.totalLessons, 2);
    assert.equal(completion.completedLessons, 2);
    assert.equal(completion.lessonsComplete, true);
  } finally {
    Module.find = originals.moduleFind;
    Lesson.find = originals.lessonFind;
    LessonProgress.find = originals.progressFind;
  }
});
