// controllers/departmentController.js
const Department = require("../models/Department");

exports.ajouterDepartment = async (req, res) => {
  try {
    const nouveau = new Department(req.body);
    await nouveau.save();
    res.status(201).json(nouveau);
  } catch (err) {
    res.status(400).json({ message: "Failed to create department.", error: err.message });
  }
};

exports.listerDepartments = async (req, res) => {
  try {
    const liste = await Department.find();
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: "An error occurred while retrieving departments.", error: err.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const item = await Department.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Department not found." });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "An error occurred while retrieving the department.", error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Department not found." });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update department.", error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Department not found." });
    }
    res.json({ message: "Department deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete department.", error: err.message });
  }
};