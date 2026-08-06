// controllers/inscriptionController.js
const Inscription = require("../models/Inscription");
const Course = require("../models/Course");

exports.ajouterInscription = async (req, res) => {
  try {
    const existing = await Inscription.findOne({
      student: req.user.id,
      course: req.body.course,
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const nouveau = new Inscription({
      ...req.body,
      student: req.user.id, 
    });
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add inscription", error: err.message });
  }
};

exports.listerInscriptions = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "student") {
      filter.student = req.user.id; // le student ne voit que ses propres inscriptions
    } else if (req.user.role === "teacher") {
      const courses = await Course.find({ Teacher: req.user.id }).select("_id");
      filter.course = { $in: courses.map((course) => course._id) };
    }
    const liste = await Inscription.find(filter)
      .populate({
        path: "course",
        populate: { path: "Teacher", select: "firstName lastName email role" },
      })
      .populate("student", "firstName lastName email role")
      .sort({ enrolledAt: -1 });
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inscriptions", error: err.message });
  }
};

exports.getInscriptionById = async (req, res) => {
  try {
    const item = await Inscription.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Failed to fetch inscription" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inscription", error: err.message });
  }
};

exports.updateInscription = async (req, res) => {
  try {
    const updated = await Inscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Failed to update inscription" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update inscription", error: err.message });
  }
};

exports.deleteInscription = async (req, res) => {
  try {
    const deleted = await Inscription.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Failed to delete inscription" });
    }
    res.json({ message: "Inscription deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete inscription", error: err.message });
  }
};
