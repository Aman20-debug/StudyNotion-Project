const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const uploadImageToCloudinary = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection")
const Section = require("../models/Section")
require("dotenv").config();


//create Courses ka handler
exports.createCourse = async (req, res) => {
    try{

        //fetch data
        const {courseName, courseDescription, whatYouWillLearn, price, category} = req.body;
        
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail)
        {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        //check for instructor
        const userID = req.user.id;
        const instructorDetails = await User.findById(userID);
        console.log("Instructor Details: ", instructorDetails);
        //TODO: Verify that userId and instructorDetails._id are same or different?
        //validation
        if(!instructorDetails)
        {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details Not Found',
            });
        }

        //check given category is valid or not
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails){ 
            return res.status(404).json({
                success: false,
                message: 'Category Details Not Found',
            });
        } 

        //upload Image to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create an entry for new Course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
        });

        //add the new Course to the user schema of Instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        );

        //update the Category ka Schema
        await Category.findByIdAndUpdate(
            {_id: categoryDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        );


        //return response
        return res.status(200).json({
            success: true,
            message: 'Course Created Successfully',
            data: newCourse,
        });
    }
    catch(err){
        console.log(err);
        return res.status(404).json({
            success: false,
            message: 'Failed to create Course',
        });
    }
}


//get All Courses ka handler function
exports.showAllCourses = async (req, res) => {
    try{
        const allCourses = await Course.find({status: "Published"}, 
                                            {
                                                courseName: true,
                                                courseDescription: true,
                                                price: true,
                                                thumbnail: true,
                                                instructor: true,
                                                ratingAndReviews: true,
                                                studentsEnrolled: true,
                                            })
                                            .populate("instructor")
                                            .exec();

        return res.status(200).json({
            success: true,
            message: 'Data for all courses fetched successfully.',
            data: allCourses,
        });
    }
    catch(err){
        console.log(err);
        return res.status(404).json({
            success: false,
            message: 'Failed to show All Course',
        });
    }
}


//Get One Single Course Details -> TODO 
exports.getCourseDetails = async (req, res) => {
    try{
        //get id
        const {courseId} = req.body;
        //find course Details
        const courseDetails = await Course.find(
                                        {_id: courseId})
                                        .populate(
                                            {
                                                path: "instructor",
                                                populate: {
                                                    path: "additionalDetails",
                                                }
                                            }
                                        )
                                        .populate("category")
                                        .populate("ratingAndReviews")
                                        .populate({
                                            path: "courseContent",
                                            populate: {
                                                path: "subSection",
                                            }
                                        })
                                        .exec();

        //validation
        if(!courseDetails)
        {
            return res.status(400).json({
                success: false,
                message: `Could Not Find the Course with ${courseId}`,
            })
        }

        return res.status(200).json({
            success: false,
            message: "Course Details fetched Successfully.",
            data: courseDetails,
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured while fetching Course Details.",
        })
    }
}

//Edit Course Details
exports.editCourse = async (req, res) => {
    try{
        const {courseID} = req.body;
        const course = await Course.findById(courseID);

        if(!course)
        {
            return res.status(404).json({
                success: false,
                message: "Could not Found Course.",
            });
        }

        
    }
    catch(err){

    }
}

//get full Course Details
exports.getFullCourseDetails = async (req, res) =>
{
    try{
        const {courseId} = req.body;
        const userId = req.user.id;
        const courseDetails = await Course.findOne({_id: courseId})
                                            .populate({
                                                path: "instructor",
                                                populate: {
                                                    path: "additionalDetails",
                                                },
                                            })
                                            .populate("category")
                                            .populate("ratingAndReviews")
                                            .populate({
                                                path: "courseContent",
                                                populate: {
                                                    path: "subSection",
                                                },
                                            })
                                            .exec()


        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })

        console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
        success: true,
        data: {
            courseDetails,
            totalDuration,
            completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//edit Course
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body
        const updates = req.body
        const course = await Course.findById(courseId)
  
        if (!course) {
            return res.status(404).json({ 
                error: "Course not found" 
            });
        }
  
        // If Thumbnail Image is found, update it
        if (req.files) {
            console.log("thumbnail update")
            const thumbnail = req.files.thumbnailImage
            const thumbnailImage = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            )
            course.thumbNail = thumbnailImage.secure_url
        }
  
        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key])
                } 
                else 
                {
                    course[key] = updates[key]
                }
            }
        }
  
        await course.save()
  
        const updatedCourse = await Course.findOne({_id: courseId,})
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()
  
        res.json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}

//get Instructor Course
exports.getInstructorCourses = async(req, res) =>{
    try{
        const instructorId = req.user.id

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.find({instructor: instructorId,}).sort({ createdAt: -1 })

        // Return the instructor's courses
        res.status(200).json({
            success: true,
            data: instructorCourses,
        })
    }
    catch(error){
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        })
    }
}

//delete Course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body
  
        // Find the course
        const course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ 
                message: "Course not found" 
            }); 
        }
  
        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            })
        }
  
        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId)
            if (section) {
                const subSections = section.subSection
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }
  
            // Delete the section
            await Section.findByIdAndDelete(sectionId)
        }
  
        // Delete the course
        await Course.findByIdAndDelete(courseId)
  
        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        })
    }
}

