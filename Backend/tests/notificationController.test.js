const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const controller = require("../controllers/notificationController");

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

test("notification lookups only return records belonging to the signed-in user", async () => {
  const originalFindOne = Notification.findOne;
  const id = new mongoose.Types.ObjectId().toString();
  let filter;
  Notification.findOne = async (query) => {
    filter = query;
    return { _id: id };
  };

  try {
    const response = makeResponse();
    await controller.getNotificationById({
      params: { id },
      user: { id: "student-1" },
    }, response);

    assert.deepEqual(filter, { _id: id, user: "student-1" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body._id, id);
  } finally {
    Notification.findOne = originalFindOne;
  }
});

test("notification updates can change only isRead and are owner-scoped", async () => {
  const originalFindOneAndUpdate = Notification.findOneAndUpdate;
  const id = new mongoose.Types.ObjectId().toString();
  let filter;
  let update;
  Notification.findOneAndUpdate = async (query, changes) => {
    filter = query;
    update = changes;
    return { _id: id, isRead: true };
  };

  try {
    const response = makeResponse();
    await controller.updateNotification({
      params: { id },
      user: { id: "student-1" },
      body: { isRead: true, user: "student-2", title: "forged" },
    }, response);

    assert.deepEqual(filter, { _id: id, user: "student-1" });
    assert.deepEqual(update, { $set: { isRead: true } });
    assert.equal(response.statusCode, 200);
  } finally {
    Notification.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("notification deletion is restricted to the signed-in user", async () => {
  const originalFindOneAndDelete = Notification.findOneAndDelete;
  const id = new mongoose.Types.ObjectId().toString();
  let filter;
  Notification.findOneAndDelete = async (query) => {
    filter = query;
    return { _id: id };
  };

  try {
    const response = makeResponse();
    await controller.deleteNotification({
      params: { id },
      user: { id: "student-1" },
    }, response);

    assert.deepEqual(filter, { _id: id, user: "student-1" });
    assert.equal(response.statusCode, 200);
  } finally {
    Notification.findOneAndDelete = originalFindOneAndDelete;
  }
});
