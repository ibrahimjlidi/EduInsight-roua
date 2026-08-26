const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    Title : { type: String, required: true },
    Description : { type: String, required: true },
    Department : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Department", required: true },
    
    Teacher : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true },
        
    Duration : String,
    Level : String,
    Image : String,
    Pdf : String,

},{ timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
