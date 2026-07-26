// models/User.js
const mongoose = require("mongoose");

const options = {
  discriminatorKey: "role",
  collection: "users",
  timestamps: true, // ajoute createdAt et updatedAt automatiquement
};

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // ne pas renvoyer le mot de passe par défaut
    },

    phone: String,

    avatar: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  options
);

module.exports = mongoose.model("User", UserSchema);