const assert = require("node:assert/strict");
const { test } = require("node:test");
const AuditLog = require("../models/AuditLog");
const Course = require("../models/Course");
const Inscription = require("../models/Inscription");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const User = require("../models/User");
const controller = require("../controllers/dashboardController");

test("admin dashboard includes the latest audit events with actor details", async () => {
  const originals = {
    auditFind: AuditLog.find,
    courseCount: Course.countDocuments,
    inscriptionCount: Inscription.countDocuments,
    quizCount: Quiz.countDocuments,
    attemptFind: QuizAttempt.find,
    userCount: User.countDocuments,
    userAggregate: User.aggregate,
  };
  const expectedAlerts = [{
    _id: "audit-1",
    action: "CREATE",
    entity: "Course",
    createdAt: new Date("2026-10-05T10:00:00.000Z"),
    user: { firstName: "Admin", lastName: "User", role: "admin" },
  }];
  let sortQuery;
  let limit;
  let populateQuery;
  AuditLog.find = () => ({
    sort(query) {
      sortQuery = query;
      return this;
    },
    limit(value) {
      limit = value;
      return this;
    },
    populate(...args) {
      populateQuery = args;
      return this;
    },
    lean: async () => expectedAlerts,
  });
  Course.countDocuments = async () => 2;
  Inscription.countDocuments = async (filter = {}) => {
    if (filter.status === "completed") return 1;
    if (filter.status === "active") return 1;
    if (filter.status === "dropped") return 0;
    return 3;
  };
  Quiz.countDocuments = async () => 1;
  QuizAttempt.find = async () => [];
  User.countDocuments = async (filter = {}) => {
    if (filter.role === "student") return 1;
    if (filter.role === "teacher") return 1;
    if (filter.role === "admin") return 1;
    return 2;
  };
  User.aggregate = async () => [];

  try {
    const response = {
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
    };
    await controller.generateForAdmin({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.recentAlerts, expectedAlerts);
    assert.equal(response.body.roleDistribution.find((item) => item.name === "Admins").value, 1);
    assert.deepEqual(sortQuery, { createdAt: -1 });
    assert.equal(limit, 5);
    assert.deepEqual(populateQuery, ["user", "firstName lastName role"]);
  } finally {
    AuditLog.find = originals.auditFind;
    Course.countDocuments = originals.courseCount;
    Inscription.countDocuments = originals.inscriptionCount;
    Quiz.countDocuments = originals.quizCount;
    QuizAttempt.find = originals.attemptFind;
    User.countDocuments = originals.userCount;
    User.aggregate = originals.userAggregate;
  }
});
