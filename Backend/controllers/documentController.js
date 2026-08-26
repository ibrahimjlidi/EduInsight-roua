const fs = require("fs/promises");
const path = require("path");
const Course = require("../models/Course");
const Document = require("../models/Document");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const canAccessCourse = async (req, courseId) => {
  if (!courseId || req.user.role === "admin") return true;
  const course = await Course.findById(courseId).select("Teacher");
  if (!course) return false;
  return req.user.role !== "teacher" || String(course.Teacher) === String(req.user.id);
};

exports.createDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }

    const { title, description, course, audience = "all" } = req.body;

    if (!(await canAccessCourse(req, course))) {
      return res.status(403).json({ message: "You cannot attach documents to this course." });
    }

    const document = await Document.create({
      title: title?.trim() || req.file.originalname,
      description,
      course: course || undefined,
      audience,
      uploadedBy: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json(await document.populate([
      { path: "course", select: "Title" },
      { path: "uploadedBy", select: "firstName lastName email role" },
    ]));
  } catch (err) {
    res.status(400).json({ message: "Failed to upload document", error: err.message });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.course) filter.course = req.query.course;
    if (req.query.audience) filter.audience = req.query.audience;

    if (req.user.role === "student") {
      filter.audience = { $in: ["all", "student"] };
    }

    if (req.user.role === "teacher") {
      const courses = await Course.find({ Teacher: req.user.id }).select("_id");
      const courseIds = courses.map((course) => course._id);
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { uploadedBy: req.user.id },
            { course: { $in: courseIds } },
            { audience: { $in: ["all", "teacher"] } },
          ],
        },
      ];
    }

    let query = Document.find(filter)
      .populate("course", "Title")
      .populate("uploadedBy", "firstName lastName email role")
      .sort({ createdAt: -1 });

    if (hasPagination) query = query.skip(skip).limit(limit);

    const [documents, total] = await Promise.all([
      query,
      hasPagination ? Document.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("documents", documents, total, page, limit));
    }

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents", error: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (req.user.role !== "admin" && String(document.uploadedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only update documents you uploaded." });
    }

    const payload = {
      title: req.body.title,
      description: req.body.description,
      audience: req.body.audience,
      course: req.body.course || null,
    };

    if (!(await canAccessCourse(req, payload.course))) {
      return res.status(403).json({ message: "You cannot attach documents to this course." });
    }

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
    Object.assign(document, payload);
    await document.save();

    res.json(await document.populate([
      { path: "course", select: "Title" },
      { path: "uploadedBy", select: "firstName lastName email role" },
    ]));
  } catch (err) {
    res.status(400).json({ message: "Failed to update document", error: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (req.user.role !== "admin" && String(document.uploadedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete documents you uploaded." });
    }

    await Document.findByIdAndDelete(document._id);
    await fs.rm(path.join(__dirname, "../uploads/docs", document.fileName), { force: true });
    res.json({ message: "Document deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete document", error: err.message });
  }
};
