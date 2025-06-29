const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async(req, res) => {
    try{
        //data fetch
        const {sectionName, courseId} = req.body;
        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: "Missing Properties.",
            });
        }

        //create section
        const newSection = await Section.create({sectionName});
        //update couse with section ObjectID
        const updateCourse = await Course.findByIdAndUpdate(
                                                            courseId,
                                                            {
                                                                $push: {
                                                                    courseContent: newSection._id,
                                                                }
                                                            },
                                                            {new: true},
        )
        .populate({
            path: 'courseContent', // Populate courseContent (sections)
            populate: {
                path: 'subSection', // Populate subSections within each section
                model: 'SubSection', // Ensure the correct model is used
            }
        });
        //HW: use populate to replace sections/sub-sections both in the updateCourseDetails
    
        //return response
        return res.status(200).json({
            success: true,
            message: "Section Created Successfully.",
            data: updateCourse,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error while Creating Section.",
        });
    }

}


//Update Section
exports.updateSection = async(req, res) => {
    try{
        //data fetch
        const {sectionName, sectionId} = req.body;
        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: "Missing Properties.",
            });
        }


        //update data
        const updatesection = await Section.findByIdAndUpdate(
                                                            sectionId,
                                                            {
                                                                sectionName,
                                                            },
                                                            {
                                                                new: true,
                                                            },
        ) 

        //return response
        return res.status(200).json({
            success: true,
            message: "Section Updated Successfully.",
            data: updatesection,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error while Updating Section.",
        });
    }
}



exports.deleteSection = async (req, res) => {
    try {
        const { sectionId, courseId } = req.body;

        if (!sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: sectionId or courseId",
            });
        }

        // 1. Delete the section
        await Section.findByIdAndDelete(sectionId);

        // 2. Remove reference from the Course model
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $pull: {
                    courseContent: sectionId,
                },
            },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection",
                model: "SubSection",
            },
        });

        // 3. Send updated course data back
        return res.status(200).json({
            success: true,
            message: "Section Deleted Successfully.",
            data: updatedCourse,
        });
    } catch (err) {
        console.log("Error in deleteSection controller:", err);
        return res.status(500).json({
            success: false,
            message: "Error while Deleting Section.",
        });
    }
};
