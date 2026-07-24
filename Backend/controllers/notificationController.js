// controllers/notificationController.js
const Notification = require("../models/Notification");

exports.ajouterNotification = async (req, res) => {
  try {
    const nouveau = new Notification(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add notification", error: err.message });
  }
};

exports.listerNotifications = async (req, res) => {
  try {
    const liste = await Notification.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const item = await Notification.findById(req.params.id);
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
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
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

exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
};