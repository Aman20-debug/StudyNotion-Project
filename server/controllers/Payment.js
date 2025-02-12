const mongoose = require("mongoose");
const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const {courseEnrollmentEmail}  = require("../mail_templates/courseEnrollmentEmail");
const mailSender = require("../utils/mailSender");
const { paymentSuccessEmail } = require("../mail_templates/paymentSuccessEmail");

//capture the payment and initiate the Razopay order
exports.capturePayment = async (req, res) => {
    try{

        //get courseID and userID
        const {courseID} = req.body;
        const userID = req.user.id;
        //validation
            //validate courseID
            if(!courseID) 
            {
                return res.status(401).json({
                    success: false,
                    message: "Please provide valid Course ID.",
                });
            }
            //valid course Details
            let courseDetails;
            try{
                courseDetails = await Course.findById(courseID);
                if(!courseDetails)
                {
                    return res.status(401).json({
                        success: false,
                        message: "Could not find Course.",
                    });
                }
                //it can happen that user is already enrolled in that course, so validate
                const userObjectID = new mongoose.Types.ObjectId(userID);
                if(courseDetails.studentsEnrolled.includes(userObjectID))
                {
                    return res.status(200).json({
                        success: false,
                        message: "Student is already enrolled.",
                    });
                }
            }
            catch(err){
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while fetching Course Details.",
                });
            }

            //order create
            const amount = Course.price;
            const currency = "INR";

            const options = {
                amount: amount*100,
                currency,
                receipt: Math.random(Date.now()).toString(),
                notes: {
                    courseID,
                    userID,
                }
            }

            try{
                //initiate the payment using razorpay
                const paymentResponse = await instance.orders.create(options);
                console.log(paymentResponse);

                //return response
                return res.status(200).json({
                    success: true, 
                    courseName: courseDetails.courseName,
                    courseDescription: courseDetails.courseDescription,
                    thumbnail: courseDetails.thumbNail,
                    orderID: paymentResponse.id,
                    currency: paymentResponse.currency,
                    amount: paymentResponse.amount,
                });
            }
            catch(err){
                console.log(err);
                return res.status(401).json({
                    success: false,
                    message: "Could Not initiate the order.",
                });
            }

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Error Occured while Capturing Payment, Please try again.",
        })
    }
}


//verify signature
exports.verifySignature = async(req, res) => {
    try{
        //server signature
        const webhookSecret = "08072003";

        //Secret key send by razorpay
        const signature = req.headers["x-razorpay-signature"];  
        //But the secret key send by razorpay is not the webhookSecret,it is some other string that has been hashed
        //so direct matching will always false answer....Therefore what we will do: we will also hash our webhookSecret and then do matching
        const shasum = crypto.createHmac("sha256", webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if(signature === digest)
        {
            console.log("Payment is Authorised.");

            //Now we need to do two things:
            //1-> Store courseID in courses of User Model
            //2-> Store userID in studentsEnrollemnt of Course Model
            //For this we need courseID and userID -> Will I get them from req ki body?
            //Ans -> NO..-> Because Whenever we extract details from req ki body it means we have filled the details in our UI so it is present in req. ki body
            //This time the request is coming from razorpay so cant get them from req. ki body.
            //These ids we will get from notes where we have stored them during order creation
            const {courseID, userID} = req.body.payload.payment.entity.notes;

            try{
                //full fill the action
                //find the course and enroll the student in it:
                const enrolledCourse = await Course.findOneAndUpdate(
                                                                    {_id: courseID},
                                                                    {
                                                                        $push: {
                                                                            studentsEnrolled: userID,        
                                                                        },
                                                                    },
                                                                    {new: true},  
                );

                if(!enrolledCourse)
                {
                    return res.status(500).json({
                        success: false,
                        message: "Course Not Found.",
                    });
                }
                console.log("After Enrolling in Course: ", enrolledCourse);

                //find the student and add the course to their list of enrolled courses me
                const enrolledStudent = await User.findOneAndUpdate(
                                                                    {_id: userID},
                                                                    {
                                                                        $push: {
                                                                            courses: courseID,
                                                                        }
                                                                    },
                                                                    {new: true},
                );
                console.log("After Enrolling in Course: ", enrolledStudent);

                // Send confirmation email
                try{
                    const emailResponse = await mailSender(
                                                    enrolledStudent.email,
                                                    "Congratulations by Aman",
                                                    courseEnrollmentEmail(
                                                            enrolledCourse.courseName,
                                                            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                                                    )
                    )
                    console.log("Email sent successfully:", emailResponse.response)
                }catch (error) {
                    // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
                    console.error("Error occurred while sending email:", error)
                    return res.status(500).json({
                    success: false,
                    message: "Error occurred while sending email",
                    })
                }


            }
            catch(err){
                return res.status(400).json({
                    success: false,
                    message: "Error Occured While FullFilling the Actions."
                });
            }
        }
        else
        {
            return res.status(400).json({
                success: false,
                message: "Invalid Request."
            });
        }
    }
    catch(err){
        return res.status(400).json({
            success: false,
            message: "Error Occured while Verifying the Signature."
        });
    }
}


//Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
    try{
        const {orderID, paymentID, amount} = req.body;
        const userID = req.user.id;

        if(!orderID || !paymentID || !amount || !userID) 
        {
            return res.status(400).json({
                success: false,
                message: "Please Provide all the Details.",
            });
        }

        try{
            const enrolledStudent = await User.findById(userID);

            await mailSender(
                            enrolledStudent.email,
                            "Payment Received",
                            paymentSuccessEmail( `${enrolledStudent.firstName} ${enrolledStudent.lastName}`, amount/100, orderID, paymentID),
            )
        }
        catch(err){
            console.log(err);
            return res.status(400).json({
                success: false,
                message: "Could not Send Payment Success Email.",
            });
        }
    }
    catch(err){
        console.log(err);
            return res.status(500).json({
                success: false,
                message: "Error Occured While Sending Payment Success Email.",
            });
    }
}