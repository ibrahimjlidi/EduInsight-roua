const assert = require("node:assert/strict");
const { test } = require("node:test");
const User = require("../models/User");
const controller = require("../controllers/userController");

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
