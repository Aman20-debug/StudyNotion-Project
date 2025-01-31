const express = require("express");
const router = express.Router();

const {auth, isInstructor} = require("../middlewares/auth");

const {updateProfile, deleteAccount, getAllUserDetails, updateImage, getEnrolledCourses, instructorDashboard} = require("../controllers/Profile");

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
router.put("/updateProfile", auth, updateProfile);
router.delete("/deleteProfile", auth, deleteAccount);
router.get("/getUserDetails", auth, getAllUserDetails);
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateImage", auth, updateImage);
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

module.exports = router;