const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const { convertSecondsToDuration } = require("../utils/secToDuration")
//Update Profile-> During SignUp we have already created a nakli profile
// initialising all variables as NULL so here we will only update the profile
// if we would not have created a nakli profile then 
// createProfile function was neccessary here
exports.updateProfile = async(req,res) => {
    try{

        //get data
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;
        //get userId
        const userId = req.user.id;
        //validation
        if(!contactNumber || !gender || !userId)
        {
            return res.status(400).json({
                success: false,
                message: "Missing Properties.",
            });
        }


        //find profile
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);


        //update profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.gender = gender;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        //save the profileDetails in db
        await profileDetails.save();


        // Find the updated user details
        const updatedUserDetails = await User.findById(userId)
                            .populate("additionalDetails")
                            .exec()

        //return response
        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully.",
            data: updatedUserDetails,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Updating Profile.",
        });
    }
}


//Delete Account
//Explore-> How can we schedule the deletion operation
exports.deleteAccount = async (req, res) => {
    try{
        //get id
        const userId = req.user.id;
        const userDetails = await User.findById(userId);
        //validation
        if(!userDetails)
        {
            return res.status(404).json({
                success: false,
                message: "User Not Found.",
            });
        }


        //delete profile
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});
        //HW: unenroll User form all enrolled Courses -> a user is enrolled in some course so delete the id of user from the array of "studentsEnrolled" present in "Course" Model
            //1-> First get all the Courses where the user is enrolled.
            const enrolledCourses = userDetails.courses;
            //2-> delete the user from the various courses he is enrolled
            for (const courseId of enrolledCourses) {
                await Course.findByIdAndUpdate(
                    courseId,
                    { $pull: { studentsEnrolled: userId } }, // Remove userId from studentsEnrolled
                    { new: true }
                );
            }


        //delete user
        await User.findByIdAndDelete({_id: userId});

        //return response
        return res.status(200).json({
            success: true,
            message: "Account Deleted Successfully.",
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Deleting Account.",
        });
    }
}


//Get All Details of User
exports.getAllUserDetails = async (req, res) => {
    try{
        //get id
        const userId = req.user.id;
        const userDetails = await User.findById(userId)
                                    .populate("additionalDetails")
                                    .exec()
        //validation
        if(!userDetails)
        {
            return res.status(404).json({
                success: false,
                message: "User Not Found.",
            });
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "User Details Extracted Successfully.",
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Fetching User Details.",
        });
    }
}

//update Image of user
exports.updateImage = async (req, res) => {
    try{
        console.log("Request received at updateImage");
        if (!req.files || !req.files.imageFile) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded.",
            });
        }

        console.log("Image file detected", req.files.imageFile);

        const imageFile = req.files.imageFile;
        const userID = req.user.id;

        const image = await uploadImageToCloudinary(imageFile, process.env.FOLDER_NAME, 1000, 1000);
        console.log(image);

        const updatedProfile = await User.findByIdAndUpdate(
                                                            {_id: userID},
                                                            {
                                                                image: image.secure_url,
                                                            },
                                                            {new: true},
        )

        //return response
        return res.status(200).json({
            success: true,
            message: "Image Uploaded Successfuly.",
            data: updatedProfile,
        });

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Error Occured While Uploading Image.",
        });
    }
}


//get Enrolled Courses
exports.getEnrolledCourses = async (req, res) => {
    try{
        //get user id
        const userId = req.user.id;
        //get user Details
        let userDetails = await User.findOne({
            _id: userId,
        })
            .populate({
              path: "courses",
              populate: {
                path: "courseContent",
                populate: {
                  path: "subSection",
                },
              },
            })
            .exec();
        userDetails = userDetails.toObject();

        //Iterating Over Courses the user is enrolled in.
        var SubsectionLength = 0;
        for (var i = 0; i < userDetails.courses.length; i++) 
        {   
            let totalDurationInSeconds = 0;
            SubsectionLength = 0;
            for(var j=0; j < userDetails.courses[i].courseContent.length; j++)
            {
                totalDurationInSeconds += userDetails.courses[i].courseContent[j].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0);

                userDetails.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);

                SubsectionLength += userDetails.courses[i].courseContent[j].subSection.length;
            }

            // Fetching User's Progress
            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            });
            courseProgressCount = courseProgressCount?.completeVideos.length;


            if (SubsectionLength === 0) 
            {
                userDetails.courses[i].progressPercentage = 100;
            } 
            else 
            {
                const multiplier = Math.pow(10, 2); // For 2 decimal precision
                userDetails.courses[i].progressPercentage =
                    Math.round(
                        (courseProgressCount / SubsectionLength) * 100 * multiplier
                    ) / multiplier;
            }
        }

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            });
        }
        
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured While getting enrolled Courses.",
        });
    }
}

//get instructor Dashboard
exports.instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentsEnroled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      res.status(200).json({ courses: courseData })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Server Error" })
    }
  }