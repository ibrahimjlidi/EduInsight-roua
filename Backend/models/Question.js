const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    quiz : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Quiz" },
    Statement :String,
    Type :{ type : String, enum : ['MCQ','TrueFalse','ShortAnswer'],default: "MCQ"},
    Points : Number,
    Order : Number,
});

module.exports = mongoose.model('Question', questionSchema);