const assert = require("node:assert/strict");
const { test } = require("node:test");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const controller = require("../controllers/authController");

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

test("register creates student accounts with generated codes and never returns the password", async () => {
  const originals = {
    findOne: User.findOne,
    studentCreate: User.discriminators.student.create,
    hash: bcrypt.hash,
  };
  let createdData;
  User.findOne = async () => null;
  User.discriminators.student.create = async (data) => {
    createdData = data;
    return { toObject: () => ({ ...data, _id: "student-1" }) };
  };
  bcrypt.hash = async () => "hashed-password";

  try {
    const response = makeResponse();
    await controller.register({
      body: {
        firstName: "  Sam ",
        lastName: " Learner ",
        email: " SAM@EXAMPLE.COM ",
        password: "password123",
        role: "student",
        level: "L1",
      },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(createdData.firstName, "Sam");
    assert.equal(createdData.lastName, "Learner");
    assert.equal(createdData.email, "sam@example.com");
    assert.match(createdData.studentCode, /^STU[A-F0-9]{6}$/);
    assert.equal(createdData.password, "hashed-password");
    assert.equal("password" in response.body.user, false);
  } finally {
    User.findOne = originals.findOne;
    User.discriminators.student.create = originals.studentCreate;
    bcrypt.hash = originals.hash;
  }
});

test("register creates teacher accounts using the selected role", async () => {
  const originals = {
    findOne: User.findOne,
    teacherCreate: User.discriminators.teacher.create,
    hash: bcrypt.hash,
  };
  let createdData;
  User.findOne = async () => null;
  User.discriminators.teacher.create = async (data) => {
    createdData = data;
    return { toObject: () => ({ ...data, _id: "teacher-1" }) };
  };
  bcrypt.hash = async () => "hashed-password";

  try {
    const response = makeResponse();
    await controller.register({
      body: {
        firstName: "Taylor",
        lastName: "Teacher",
        email: "teacher@example.com",
        password: "password123",
        role: "teacher",
        speciality: "  Mathematics ",
        office: "  Room 2 ",
      },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(createdData.role, undefined);
    assert.equal(createdData.speciality, "Mathematics");
    assert.equal(createdData.office, "Room 2");
    assert.equal("studentCode" in createdData, false);
  } finally {
    User.findOne = originals.findOne;
    User.discriminators.teacher.create = originals.teacherCreate;
    bcrypt.hash = originals.hash;
  }
});

test("register rejects privileged and unsupported roles", async () => {
  const response = makeResponse();
  await controller.register({
    body: {
      firstName: "Sam",
      lastName: "Learner",
      email: "sam@example.com",
      password: "password123",
      role: "admin",
    },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Invalid account role.");
});
