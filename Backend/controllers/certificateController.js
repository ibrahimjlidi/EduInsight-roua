const Certificate = require("../models/Certificate");

exports.listMine = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate("course", "Title Description Duration")
      .sort({ issuedAt: -1 });
    res.json(certificates);
  } catch (err) {
    console.error("Failed to retrieve student certificates:", err.message);
    res.status(500).json({ message: "Failed to retrieve certificates." });
  }
};
