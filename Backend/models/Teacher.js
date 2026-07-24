const mongoose = require("mongoose");
const User = require("./User");

const TeacherSchema = new mongoose.Schema({
  speciality: {
    type: String,
    required: true,
  },

  office: String,

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
});

module.exports = User.discriminator("teacher", TeacherSchema);

