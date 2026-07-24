//choice pour MCQ
const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    },
    Text : String,
    isCorrect : {type : Boolean, default: false},
    Order : Number,
});

module.exports = mongoose.model('Choice', moduleSchema);