const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    audience: {
      type: String,
      enum: ["all", "admin", "teacher", "student"],
      default: "all",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
