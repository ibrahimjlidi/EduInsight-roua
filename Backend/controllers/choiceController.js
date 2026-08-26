// controllers/choiceController.js
const Choice = require("../models/Choice");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

exports.ajouterChoice = async (req, res) => {
  try {
    const nouveau = new Choice(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to add choice", error: err.message });
  }
};

exports.listerChoices = async (req, res) => {
  try {
    const hasPagination = req.query.page || req.query.limit;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.question) filter.question = req.query.question;

    let query = Choice.find(filter).populate("question", "Statement").sort({ Order: 1, createdAt: 1 });
    if (hasPagination) query = query.skip(skip).limit(limit);

    const [choices, total] = await Promise.all([
      query,
      hasPagination ? Choice.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json(buildPaginationResponse("choices", choices, total, page, limit));
    }

    res.json(choices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch choices", error: err.message });
  }
};

exports.getChoiceById = async (req, res) => {
  try {
    const item = await Choice.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch choice", error: err.message });
  }
};

exports.updateChoice = async (req, res) => {
  try {
    const updated = await Choice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update choice", error: err.message });
  }
};

exports.deleteChoice = async (req, res) => {
  try {
    const deleted = await Choice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Choice not found" });
    }
    res.json({ message: "Choice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete choice", error: err.message });
  }
};
