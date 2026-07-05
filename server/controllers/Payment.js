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

  if (!courses || courses.length === 0) {
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
    receipt: crypto.randomBytes(16).toString("hex"),
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

  // Timing-safe comparison to avoid leaking signature info
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(razorpay_signature, "utf8");
  const isValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (isValid) {
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
