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

UserSchema.index(
  { role: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "admin", isActive: true },
    name: "unique_active_admin",
  }
);

module.exports = mongoose.model("User", UserSchema);