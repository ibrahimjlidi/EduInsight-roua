const assert = require("node:assert/strict");
const { test } = require("node:test");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const controller = require("../controllers/userController");

const createResponse = () => ({
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

test("admin user creation is rejected when an active admin already exists", async () => {
  const originals = {
    findOne: User.findOne,
    exists: User.exists,
    adminCreate: User.discriminators.admin.create,
  };
  let createCalled = false;
  User.findOne = async () => null;
  User.exists = async () => ({ _id: "existing-admin" });
  User.discriminators.admin.create = async () => {
    createCalled = true;
  };

  try {
    const response = createResponse();

    await controller.ajouterUtilisateur({
      body: {
        firstName: "Another",
        lastName: "Admin",
        email: "another-admin@example.com",
        password: "password123",
        role: "admin",
      },
      user: { id: "existing-admin" },
      ip: "127.0.0.1",
    }, response);

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.message, "An active admin account already exists.");
    assert.equal(createCalled, false);
  } finally {
    User.findOne = originals.findOne;
    User.exists = originals.exists;
    User.discriminators.admin.create = originals.adminCreate;
  }
});

test("teacher updates persist discriminator fields through the teacher model", async () => {
  const teacherModel = User.discriminators.teacher;
  const originals = {
    findById: User.findById,
    teacherUpdate: teacherModel.findByIdAndUpdate,
    auditCreate: AuditLog.create,
  };
  let update;
  User.findById = async () => ({ _id: "teacher-id", role: "teacher" });
  teacherModel.findByIdAndUpdate = async (id, fields, options) => {
    update = { id, fields, options };
    return {
      _id: id,
      firstName: "Taylor",
      lastName: "Teacher",
      role: "teacher",
      speciality: fields.speciality,
      office: fields.office,
      toObject() {
        return { ...this };
      },
    };
  };
  AuditLog.create = async () => ({});

  try {
    const response = createResponse();
    await controller.updateUtilisateur({
      params: { id: "teacher-id" },
      body: { speciality: "Mathematics", office: "B12" },
      user: { id: "admin-id", role: "admin" },
      ip: "127.0.0.1",
    }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(update, {
      id: "teacher-id",
      fields: { speciality: "Mathematics", office: "B12" },
      options: { new: true, runValidators: true },
    });
    assert.equal(response.body.speciality, "Mathematics");
    assert.equal(response.body.office, "B12");
  } finally {
    User.findById = originals.findById;
    teacherModel.findByIdAndUpdate = originals.teacherUpdate;
    AuditLog.create = originals.auditCreate;
  }
});

test("user deletion removes the database record and records a delete audit action", async () => {
  const originals = {
    findByIdAndDelete: User.findByIdAndDelete,
    auditCreate: AuditLog.create,
  };
  let auditEntry;
  User.findByIdAndDelete = async (id) => ({ _id: id });
  AuditLog.create = async (entry) => {
    auditEntry = entry;
    return {};
  };

  try {
    const response = createResponse();
    await controller.deleteUtilisateur({
      params: { id: "user-id" },
      user: { id: "admin-id" },
      ip: "127.0.0.1",
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, "User deleted successfully.");
    assert.equal(auditEntry.action, "DELETE");
    assert.equal(auditEntry.entityId, "user-id");
  } finally {
    User.findByIdAndDelete = originals.findByIdAndDelete;
    AuditLog.create = originals.auditCreate;
  }
});
