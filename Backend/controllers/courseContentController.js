const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const logAudit = require("../utils/auditLogger");

const getEditableCourse = async (req, res) => {
  const course = await Course.findById(req.params.courseId).select("Teacher");
  if (!course) {
    res.status(404).json({ message: "Course not found." });
    return null;
  }
  if (req.user.role !== "admin" && String(course.Teacher) !== String(req.user.id)) {
    res.status(403).json({ message: "You can only manage content for your own courses." });
    return null;
  }
  return course;
};

const getValidOrder = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") return fallback;
  const order = Number(value);
  return Number.isInteger(order) && order > 0 ? order : null;
};

exports.getCourseContent = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;

    const modules = await Module.find({ course: course._id }).sort({ Order: 1, createdAt: 1 });
    const lessons = await Lesson.find({ module: { $in: modules.map((module) => module._id) } })
      .sort({ Order: 1, createdAt: 1 });
    res.json(modules.map((module) => ({
      ...module.toObject(),
      lessons: lessons.filter((lesson) => String(lesson.module) === String(module._id)),
    })));
  } catch (err) {
    console.error("Failed to retrieve course content:", err.message);
    res.status(500).json({ message: "Failed to retrieve course content." });
  }
};

exports.createModule = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const title = typeof req.body.Title === "string" ? req.body.Title.trim() : "";
    if (!title) return res.status(400).json({ message: "Module title is required." });
    const order = getValidOrder(req.body.Order);
    if (order === null) return res.status(400).json({ message: "Module order must be a positive integer." });

    const module = await Module.create({
      Title: title,
      Description: typeof req.body.Description === "string" ? req.body.Description.trim() : "",
      Order: order,
      course: course._id,
    });
    await logAudit(req.user.id, "CREATE", "Module", module._id, req.ip);
    res.status(201).json({ ...module.toObject(), lessons: [] });
  } catch (err) {
    console.error("Failed to create course module:", err.message);
    res.status(400).json({ message: "Failed to create module.", error: err.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const module = await Module.findOne({ _id: req.params.moduleId, course: course._id });
    if (!module) return res.status(404).json({ message: "Module not found in this course." });

    if (typeof req.body.Title === "string") {
      const title = req.body.Title.trim();
      if (!title) return res.status(400).json({ message: "Module title cannot be empty." });
      module.Title = title;
    }
    if (typeof req.body.Description === "string") module.Description = req.body.Description.trim();
    if (req.body.Order !== undefined) {
      const order = Number(req.body.Order);
      if (!Number.isInteger(order) || order < 1) return res.status(400).json({ message: "Module order must be a positive integer." });
      module.Order = order;
    }
    await module.save();
    await logAudit(req.user.id, "UPDATE", "Module", module._id, req.ip);
    res.json(module);
  } catch (err) {
    console.error("Failed to update course module:", err.message);
    res.status(400).json({ message: "Failed to update module.", error: err.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const module = await Module.findOneAndDelete({ _id: req.params.moduleId, course: course._id });
    if (!module) return res.status(404).json({ message: "Module not found in this course." });

    const lessons = await Lesson.find({ module: module._id }).select("_id");
    const lessonIds = lessons.map((lesson) => lesson._id);
    await Promise.all([
      Lesson.deleteMany({ _id: { $in: lessonIds } }),
      LessonProgress.deleteMany({ course: course._id, lesson: { $in: lessonIds } }),
    ]);
    await logAudit(req.user.id, "DELETE", "Module", module._id, req.ip);
    res.json({ message: "Module and its lessons were deleted." });
  } catch (err) {
    console.error("Failed to delete course module:", err.message);
    res.status(500).json({ message: "Failed to delete module." });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const module = await Module.findOne({ _id: req.params.moduleId, course: course._id });
    if (!module) return res.status(404).json({ message: "Module not found in this course." });

    const title = typeof req.body.Title === "string" ? req.body.Title.trim() : "";
    const content = typeof req.body.Content === "string" ? req.body.Content.trim() : "";
    if (!title || !content) {
      return res.status(400).json({ message: "Lesson title and learning content are required." });
    }
    const order = getValidOrder(req.body.Order);
    if (order === null) return res.status(400).json({ message: "Lesson order must be a positive integer." });

    const lesson = await Lesson.create({
      Title: title,
      Content: content,
      VideoUrl: typeof req.body.VideoUrl === "string" ? req.body.VideoUrl.trim() : "",
      PdfUrl: typeof req.body.PdfUrl === "string" ? req.body.PdfUrl.trim() : "",
      Order: order,
      module: module._id,
    });
    await logAudit(req.user.id, "CREATE", "Lesson", lesson._id, req.ip);
    res.status(201).json(lesson);
  } catch (err) {
    console.error("Failed to create course lesson:", err.message);
    res.status(400).json({ message: "Failed to create lesson.", error: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const module = await Module.findOne({ _id: req.params.moduleId, course: course._id });
    if (!module) return res.status(404).json({ message: "Module not found in this course." });
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, module: module._id });
    if (!lesson) return res.status(404).json({ message: "Lesson not found in this module." });

    let learningContentChanged = false;
    if (typeof req.body.Title === "string") {
      const title = req.body.Title.trim();
      if (!title) return res.status(400).json({ message: "Lesson title cannot be empty." });
      learningContentChanged ||= title !== lesson.Title;
      lesson.Title = title;
    }
    if (typeof req.body.Content === "string") {
      const content = req.body.Content.trim();
      if (!content) return res.status(400).json({ message: "Lesson content cannot be empty." });
      learningContentChanged ||= content !== lesson.Content;
      lesson.Content = content;
    }
    if (typeof req.body.VideoUrl === "string") lesson.VideoUrl = req.body.VideoUrl.trim();
    if (typeof req.body.PdfUrl === "string") lesson.PdfUrl = req.body.PdfUrl.trim();
    if (req.body.Order !== undefined) {
      const order = Number(req.body.Order);
      if (!Number.isInteger(order) || order < 1) return res.status(400).json({ message: "Lesson order must be a positive integer." });
      lesson.Order = order;
    }
    await lesson.save();
    if (learningContentChanged) {
      await LessonProgress.deleteMany({ course: course._id, lesson: lesson._id });
    }
    await logAudit(req.user.id, "UPDATE", "Lesson", lesson._id, req.ip);
    res.json(lesson);
  } catch (err) {
    console.error("Failed to update course lesson:", err.message);
    res.status(400).json({ message: "Failed to update lesson.", error: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const course = await getEditableCourse(req, res);
    if (!course) return;
    const module = await Module.findOne({ _id: req.params.moduleId, course: course._id });
    if (!module) return res.status(404).json({ message: "Module not found in this course." });
    const lesson = await Lesson.findOneAndDelete({ _id: req.params.lessonId, module: module._id });
    if (!lesson) return res.status(404).json({ message: "Lesson not found in this module." });

    await LessonProgress.deleteMany({ course: course._id, lesson: lesson._id });
    await logAudit(req.user.id, "DELETE", "Lesson", lesson._id, req.ip);
    res.json({ message: "Lesson deleted." });
  } catch (err) {
    console.error("Failed to delete course lesson:", err.message);
    res.status(500).json({ message: "Failed to delete lesson." });
  }
};
