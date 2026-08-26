// controllers/notificationController.js
const Notification = require("../models/Notification");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const ownerFilter = (req) => ({
  $or: [
    { user: req.user.id },
    { user: null },
    { user: { $exists: false } },
  ],
});

exports.ajouterNotification = async (req, res) => {
  try {
    const nouveau = new Notification({
      ...req.body,
      user: req.user.role === "admin" && req.body.user ? req.body.user : req.user.id,
    });
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add notification", error: err.message });
  }
};

exports.listerNotifications = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const filter = ownerFilter(req);

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    let query = Notification.find(filter).sort({ createdAt: -1 });
    if (hasPagination) {
      query = query.skip(skip).limit(limit);
    } else {
      query = query.limit(10);
    }

    const [liste, total, unread] = await Promise.all([
      query,
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...ownerFilter(req), isRead: false }),
    ]);

    if (hasPagination) {
      return res.json({
        ...buildPaginationResponse("notifications", liste, total, page, limit),
        unread,
      });
    }

    res.json({ notifications: liste, total, unread });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const item = await Notification.findOne({ _id: req.params.id, ...ownerFilter(req) });
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
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...ownerFilter(req) },
      { isRead: req.body.isRead },
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

exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(ownerFilter(req), { isRead: true });
    res.json({ message: "Notifications marked as read", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(400).json({ message: "Failed to mark notifications as read", error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
};
