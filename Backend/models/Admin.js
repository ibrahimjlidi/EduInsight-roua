const User = require("./User");
const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    permissions: [{
        type: String
    }]
});

module.exports = User.discriminator("admin", AdminSchema);
