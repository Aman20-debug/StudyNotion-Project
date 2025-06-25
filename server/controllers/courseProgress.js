const mongoose = require("mongoose")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const CourseProgress = require("../models/CourseProgress")
const Course = require("../models/Course")

exports.updateCourseProgress = async (req, res) => {
  try {
    console.log("✅ Update Course Progress Backend HIT")

    const { courseId, subsectionId } = req.body
    const userId = req.user.id

    console.log("➡️ Course Id: ", courseId)
    console.log("➡️ SubSection Id: ", subsectionId)
    console.log("➡️ User Id: ", userId)

    // Check if subsection exists
    const subsection = await SubSection.findById(subsectionId)
    if (!subsection) {
      console.log("❌ Invalid subsection ID:", subsectionId)
      return res.status(404).json({
        error: "Invalid subSection",
      })
    }

    // Find or validate course progress
    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    if (!courseProgress) {
      console.log("❌ Course Progress not found for user:", userId)
      return res.status(404).json({
        success: false,
        message: "Course Progress Does not exist",
      })
    }

    // Check if video already completed
    if (courseProgress.completeVideos.includes(subsectionId)) {
      console.log("⚠️ Subsection already completed:", subsectionId)
      return res.status(400).json({
        error: "SubSection already completed",
      })
    }

    // Add subsection to completed
    courseProgress.completeVideos.push(subsectionId)

    // Save updated progress
    await courseProgress.save()
    console.log("✅ Course Progress updated successfully:", courseProgress)

    return res.status(200).json({
      success: true,
      message: "Course Progress Updated",
      data: courseProgress.completeVideos,
    })
  } catch (err) {
    console.log("❌ ERROR in updateCourseProgress:", err)
    return res.status(500).json({
      error: "Internal server error",
    })
  }
}
