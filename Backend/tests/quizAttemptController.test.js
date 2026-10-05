const assert = require("node:assert/strict");
const { test } = require("node:test");
const Inscription = require("../models/Inscription");
const Quiz = require("../models/Quiz");
const controller = require("../controllers/quizAttemptController");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("students cannot start a quiz before it is published", async () => {
  const originalFindById = Quiz.findById;
  let enrollmentLookupCalled = false;
  const originalFindOne = Inscription.findOne;
  Quiz.findById = async () => ({ _id: "quiz-1", isPublished: false });
  Inscription.findOne = async () => {
    enrollmentLookupCalled = true;
    return null;
  };

  try {
    const response = makeResponse();
    await controller.ajouterQuizAttempt({
      body: { quiz: "quiz-1" },
      user: { id: "student-1" },
    }, response);

    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /not published/i);
    assert.equal(enrollmentLookupCalled, false);
  } finally {
    Quiz.findById = originalFindById;
    Inscription.findOne = originalFindOne;
  }
});

test("students cannot start a quiz without an enrollment", async () => {
  const originalFindById = Quiz.findById;
  const originalFindOne = Inscription.findOne;
  let enrollmentFilter;
  Quiz.findById = async () => ({ _id: "quiz-1", course: "course-1", isPublished: true });
  Inscription.findOne = async (filter) => {
    enrollmentFilter = filter;
    return null;
  };

  try {
    const response = makeResponse();
    await controller.ajouterQuizAttempt({
      body: { quiz: "quiz-1" },
      user: { id: "student-1" },
    }, response);

    assert.deepEqual(enrollmentFilter, { student: "student-1", course: "course-1" });
    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /enroll/i);
  } finally {
    Quiz.findById = originalFindById;
    Inscription.findOne = originalFindOne;
  }
});
