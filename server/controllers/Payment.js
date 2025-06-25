// const mongoose = require("mongoose");
// const {instance} = require("../config/razorpay");
// const Course = require("../models/Course");
// const User = require("../models/User");
// const {courseEnrollmentEmail}  = require("../mail_templates/courseEnrollmentEmail");
// const mailSender = require("../utils/mailSender");
// const { paymentSuccessEmail } = require("../mail_templates/paymentSuccessEmail");

// //capture the payment and initiate the Razopay order
// exports.capturePayment = async (req, res) => {
//     try{

//         //get courseID and userID
//         const {courseID} = req.body;
//         const userID = req.user.id;
//         //validation
//             //validate courseID
//             if(!courseID) 
//             {
//                 return res.status(401).json({
//                     success: false,
//                     message: "Please provide valid Course ID.",
//                 });
//             }
//             //valid course Details
//             let courseDetails;
//             try{
//                 courseDetails = await Course.findById(courseID);
//                 if(!courseDetails)
//                 {
//                     return res.status(401).json({
//                         success: false,
//                         message: "Could not find Course.",
//                     });
//                 }
//                 //it can happen that user is already enrolled in that course, so validate
//                 const userObjectID = new mongoose.Types.ObjectId(userID);
//                 if(courseDetails.studentsEnrolled.includes(userObjectID))
//                 {
//                     return res.status(200).json({
//                         success: false,
//                         message: "Student is already enrolled.",
//                     });
//                 }
//             }
//             catch(err){
//                 console.log(err);
//                 return res.status(500).json({
//                     success: false,
//                     message: "Error while fetching Course Details.",
//                 });
//             }

//             //order create
//             const amount = Course.price;
//             const currency = "INR";

//             const options = {
//                 amount: amount*100,
//                 currency,
//                 receipt: Math.random(Date.now()).toString(),
//                 notes: {
//                     courseID,
//                     userID,
//                 }
//             }

//             try{
//                 //initiate the payment using razorpay
//                 const paymentResponse = await instance.orders.create(options);
//                 console.log(paymentResponse);

//                 //return response
//                 return res.status(200).json({
//                     success: true, 
//                     courseName: courseDetails.courseName,
//                     courseDescription: courseDetails.courseDescription,
//                     thumbnail: courseDetails.thumbNail,
//                     orderID: paymentResponse.id,
//                     currency: paymentResponse.currency,
//                     amount: paymentResponse.amount,
//                 });
//             }
//             catch(err){
//                 console.log(err);
//                 return res.status(401).json({
//                     success: false,
//                     message: "Could Not initiate the order.",
//                 });
//             }

//     }
//     catch(err){
//         return res.status(500).json({
//             success: false,
//             message: "Error Occured while Capturing Payment, Please try again.",
//         })
//     }
// }


// //verify signature
// exports.verifySignature = async(req, res) => {
//     try{
//         //server signature
//         const webhookSecret = "08072003";

//         //Secret key send by razorpay
//         const signature = req.headers["x-razorpay-signature"];  
//         //But the secret key send by razorpay is not the webhookSecret,it is some other string that has been hashed
//         //so direct matching will always false answer....Therefore what we will do: we will also hash our webhookSecret and then do matching
//         const shasum = crypto.createHmac("sha256", webhookSecret);
//         shasum.update(JSON.stringify(req.body));
//         const digest = shasum.digest("hex");

//         if(signature === digest)
//         {
//             console.log("Payment is Authorised.");

//             //Now we need to do two things:
//             //1-> Store courseID in courses of User Model
//             //2-> Store userID in studentsEnrollemnt of Course Model
//             //For this we need courseID and userID -> Will I get them from req ki body?
//             //Ans -> NO..-> Because Whenever we extract details from req ki body it means we have filled the details in our UI so it is present in req. ki body
//             //This time the request is coming from razorpay so cant get them from req. ki body.
//             //These ids we will get from notes where we have stored them during order creation
//             const {courseID, userID} = req.body.payload.payment.entity.notes;

//             try{
//                 //full fill the action
//                 //find the course and enroll the student in it:
//                 const enrolledCourse = await Course.findOneAndUpdate(
//                                                                     {_id: courseID},
//                                                                     {
//                                                                         $push: {
//                                                                             studentsEnrolled: userID,        
//                                                                         },
//                                                                     },
//                                                                     {new: true},  
//                 );

//                 if(!enrolledCourse)
//                 {
//                     return res.status(500).json({
//                         success: false,
//                         message: "Course Not Found.",
//                     });
//                 }
//                 console.log("After Enrolling in Course: ", enrolledCourse);

//                 //find the student and add the course to their list of enrolled courses me
//                 const enrolledStudent = await User.findOneAndUpdate(
//                                                                     {_id: userID},
//                                                                     {
//                                                                         $push: {
//                                                                             courses: courseID,
//                                                                         }
//                                                                     },
//                                                                     {new: true},
//                 );
//                 console.log("After Enrolling in Course: ", enrolledStudent);

//                 // Send confirmation email
//                 try{
//                     const emailResponse = await mailSender(
//                                                     enrolledStudent.email,
//                                                     "Congratulations by Aman",
//                                                     courseEnrollmentEmail(
//                                                             enrolledCourse.courseName,
//                                                             `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
//                                                     )
//                     )
//                     console.log("Email sent successfully:", emailResponse.response)
//                 }catch (error) {
//                     // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
//                     console.error("Error occurred while sending email:", error)
//                     return res.status(500).json({
//                     success: false,
//                     message: "Error occurred while sending email",
//                     })
//                 }


//             }
//             catch(err){
//                 return res.status(400).json({
//                     success: false,
//                     message: "Error Occured While FullFilling the Actions."
//                 });
//             }
//         }
//         else
//         {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid Request."
//             });
//         }
//     }
//     catch(err){
//         return res.status(400).json({
//             success: false,
//             message: "Error Occured while Verifying the Signature."
//         });
//     }
// }


// //Send Payment Success Email
// exports.sendPaymentSuccessEmail = async (req, res) => {
//     try{
//         const {orderID, paymentID, amount} = req.body;
//         const userID = req.user.id;

//         if(!orderID || !paymentID || !amount || !userID) 
//         {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please Provide all the Details.",
//             });
//         }

//         try{
//             const enrolledStudent = await User.findById(userID);

//             await mailSender(
//                             enrolledStudent.email,
//                             "Payment Received",
//                             paymentSuccessEmail( `${enrolledStudent.firstName} ${enrolledStudent.lastName}`, amount/100, orderID, paymentID),
//             )
//         }
//         catch(err){
//             console.log(err);
//             return res.status(400).json({
//                 success: false,
//                 message: "Could not Send Payment Success Email.",
//             });
//         }
//     }
//     catch(err){
//         console.log(err);
//             return res.status(500).json({
//                 success: false,
//                 message: "Error Occured While Sending Payment Success Email.",
//             });
//     }
// }




const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");

const {
  courseEnrollmentEmail,
} = require("../mail_templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail_templates/paymentSuccessEmail");

const CourseProgress = require("../models/CourseProgress");

// Capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" });
  }

  let total_amount = 0;

  for (const course_id of courses) {
    let course;
    try {
      course = await Course.findById(course_id);

      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Could not find the Course" });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(409)
          .json({ success: false, message: "Student is already Enrolled" });
      }

      total_amount += course.price;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    console.log("Razorpay Payment Response:", paymentResponse);
    return res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Could not initiate order." });
  }
};

// Verify the payment
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courses,
  } = req.body;

  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(400).json({ success: false, message: "Payment Failed" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res);
    return res.status(200).json({ success: true, message: "Payment Verified" });
  }

  return res.status(400).json({ success: false, message: "Payment Verification Failed" });
};

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" });
  }

  try {
    const enrolledStudent = await User.findById(userId);

    await mailSender(
      enrolledStudent.email,
      "Payment Received",
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment success email sent successfully",
    });
  } catch (error) {
    console.log("Error in sending payment email", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not send email" });
  }
};

// Enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing Course ID or User ID" });
  }

  for (const courseId of courses) {
    try {
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res
          .status(404)
          .json({ success: false, error: "Course not found" });
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      );

      console.log(
        `Enrollment success: ${enrolledStudent.email} enrolled in ${enrolledCourse.courseName}`
      );
    } catch (error) {
      console.log("Enrollment error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};
