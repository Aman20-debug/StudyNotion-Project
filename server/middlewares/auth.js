const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

//auth
exports.auth = async (req, res, next) => {
  try {
    // Prioritize Authorization header first
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.body?.token) {
      token = req.body.token;
    }

    console.log("Token in Auth: ", token);

    // If token is missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Token is invalid or expired.",
    });
  }
};


//isStudent
exports.isStudent = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for students only."
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "User role cannnot be verified, please try again.",
        });
    }
}

//isInstructor
exports.isInstructor = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Instructor only."
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "User role cannnot be verified, please try again.",
        });
    }
}


//isAdmin
exports.isAdmin = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Admin only."
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "User role cannnot be verified, please try again.",
        });
    }
}