const mongoose = require("mongoose");
const Notification = require("../models/Notification");

exports.listerNotifications = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    res.json({
      notifications,
      unread,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }
    const item = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notification", error: err.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }
    if (typeof req.body.isRead !== "boolean") {
      return res.status(400).json({ message: "isRead must be a boolean." });
    }
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { isRead: req.body.isRead } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update notification", error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read", error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
};