//Model 3
const mongoose = require("mongoose");

const Course = new mongoose.Schema({
    courseName: {
        type: String,
    },

    courseDescription: {
        type: String,
    },

    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    whatYouWillLearn: {
        type: String,
    },

    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
        }
    ],

    ratingAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReview",
        }
    ],

    price: {
        type: Number,
    },

    thumbNail: {
        type: String,
    },

    tag: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
    },

    studentsEnrolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ],


});

module.exports = mongoose.model("Course", Course);