const Notification = require("../models/Notification");

const createNotification = async ({ user, title, message, type = "info", link }) => {
  if (!user || !title) return null;

  try {
    return await Notification.create({
      user,
      title,
      message,
      type,
      ...(link ? { link } : {}),
    });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

module.exports = createNotification;
