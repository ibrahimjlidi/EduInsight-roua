const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
    Title : String,
    Description : String,
    Order : Number,
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Course" },

}, { timestamps: { createdAt: true, updatedAt: false } });
    
module.exports = mongoose.model('Module', moduleSchema);