const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//create Rating
exports.createRating = async (req, res) => {
    try{
        console.log("Backend Rating HIT");
        //get user id
        console.log("Request Body:", req.body)
        console.log("User ID:", req.user.id)
        const userID = req.user.id;
        //fetch data from req ki body
        const {rating, review, courseID} = req.body;
        //check if user is enrolled or not-> User Enrolled only they can review
        const courseDetails = await Course.findOne(
                                                {_id: courseID,
                                                studentsEnrolled: {$elemMatch: {$eq: userID}},
                                });
        
        if(!courseDetails)
        {
            return res.status(404).json({
                success: false,
                message: "Students is Enrolled in the Course.",
            });
        }
        
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                                            user: userID,
                                                            course: courseID,
        });
        if(alreadyReviewed)
        {
            return res.status(403).json({
                success: false,
                message:"User has already Reviewed the Course.",
            });
        }


        //create rating and review
        const ratingAndReview = await RatingAndReview.create({
                                                            rating, review,
                                                            course: courseID,
                                                            user: userID,
        });

        //update course with this rating and review
        const updateCourseDetails = await Course.findByIdAndUpdate(
                                                                {_id: courseID},
                                                                {
                                                                    $push: {
                                                                        ratingAndReviews: ratingAndReview._id,
                                                                    }
                                                                },
                                                                {new: true},                     
        )

        console.log(updateCourseDetails);
        //return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review Created Successfully.",
            data: updateCourseDetails,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured while creating Rating and Review.",
        });
    }
}


//get Average Rating
exports.getAverageRating = async (req, res) => {
    try{
        //we want to calculate avg rating...therefore we want all ratingandReview of that course..therefore we want course id
        //get courseID
        const courseID = req.body.courseid;

        //calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                //With this we will get all the ratingAndReview of that course
                $match: {
                    course: new mongoose.Types.ObjectId(courseID),
                },

                //Now grouping
                $group: {
                    _id: null,  //We dnt know on what basis to group all ratingAndReview...therefore id set to NULL
                    averageRating: { $avg: "$rating"},
                }
            }
        ])

        //return rating
        if(result.length > 0)
        {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        //if no rating/Review exist
        return res.status(200).json({
            success: true,
            message: "Average Rating is 0, no ratings given till now.",
            averageRating: 0,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured While Calculating avearge Rating.",
        });
    }
}


//get All Rating And Review
exports.getAllRating = async (req, res) => {
    try{
        const allRatingAndReview = await RatingAndReview.find({})
                                                            .sort({rating: "desc"})
                                                            .populate({
                                                                path: "user",
                                                                select: "firstName lastName email image",
                                                            })
                                                            .populate({
                                                                path: 'course',
                                                                select: "courseName",
                                                            })
                                                            .exec();
        //return response                                            
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data: allRatingAndReview,
        });
                                                            
    }   
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured While Fetching All Rating And Review.",
        });
    }
}



//get All Rating And Review of a particular Course
exports.getRatingAndReview = async (req, res) => {
    try{

        // Extract course ID from request parameters
        const { courseId } = req.params;

        // Find the course by ID and populate its ratings and reviews
        const course = await Course.findById(courseId)
            .sort({rating: "desc"})
            .populate({
                path: "ratingAndReviews",
                populate: {
                    path: "user",
                    select: "firstName lastName email image",
                },
            });

        // If the course is not found
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        // Return the ratings and reviews
        return res.status(200).json({
            success: true,
            message: `Rating And Review of ${course.courseName} Course fetched Successfully.`,
            data: course.ratingAndReviews,
        });

    }   
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error Occured While Fetching All Rating And Review of the Course.",
        });
    }
}