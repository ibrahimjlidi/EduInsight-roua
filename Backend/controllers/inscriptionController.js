// controllers/inscriptionController.js
const Inscription = require("../models/Inscription");

exports.ajouterInscription = async (req, res) => {
  try {
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
    const liste = await Inscription.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inscriptions", error: err.message });
  }
};

exports.getInscriptionById = async (req, res) => {
  try {
    const item = await Inscription.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Failed to fetch inscription", error: err.message });
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
      return res.status(404).json({ message: "Failed to update inscription", error: err.message });
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
      return res.status(404).json({ message: "Failed to delete inscription", error: err.message });
    }
    res.json({ message: "Failed to delete inscription", error: err.message });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete inscription", error: err.message });
  }
};