const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    course : {
        type :mongoose.Schema.Types.ObjectId,
        ref : "Course"  
    },
    Title : String,
    Description : String,
    Duration : Number,
    isPublished : { type : Boolean, default : false },

    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{ timestamps: true}
);

module.exports = mongoose.model('Quiz', quizSchema);