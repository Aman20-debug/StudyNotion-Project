//Model 9
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },

    otp: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,   // function reference, so each document gets its own timestamp
        expires: 5*60,       // document auto-deletes 5 minutes after creation
    },

});

// NOTE: the verification email is sent from the sendOTP controller using the
// styled template. We intentionally do NOT send it from a pre-save hook here,
// otherwise the user would receive two emails per OTP request.

module.exports = mongoose.model("OTP", otpSchema);