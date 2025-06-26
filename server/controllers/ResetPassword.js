const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const FRONTEND_URL = require("../utils/url");


// RESET PASSWORD TOKEN CONTROLLER
exports.resetPasswordToken = async (req, res) => {
  try {
    const email = req.body.email;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your Email is not registered with us.",
      });
    }

    // Generate secure token
    const token = crypto.randomUUID(); // Optional: use crypto.randomBytes(32).toString("hex") for more entropy

    // Set token and expiry on user
    await User.findOneAndUpdate(
      { email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000, // 5 minutes
      },
      { new: true }
    );

    // Prepare frontend URL
    const frontendUrl = FRONTEND_URL || "http://localhost:5173";
    const url = `${frontendUrl}/update-password/${token}`;

    // Send mail
    await mailSender(
      email,
      "Password Reset Link",
      `Click here to reset your password: ${url}`
    );

    return res.status(200).json({
      success: true,
      message:
        "Email sent successfully. Please check your inbox to reset your password.",
    });
  } catch (err) {
    console.error("Reset Password Token Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset password email.",
    });
  }
};

// RESET PASSWORD CONTROLLER
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Password and Confirm Password do not match.",
      });
    }

    // Get user with matching token
    const userDetails = await User.findOne({ token });

    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    // Check token expiration
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please try again.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear token/expiry
    await User.findOneAndUpdate(
      { token },
      {
        password: hashedPassword,
        token: undefined,
        resetPasswordExpires: undefined,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting the password.",
    });
  }
};
