const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  type: { type: String, default: "info", trim: true, maxlength: 40 },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: (value) => !value || (value.startsWith("/") && !value.startsWith("//")),
      message: "Notification links must be relative application paths.",
    },
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);