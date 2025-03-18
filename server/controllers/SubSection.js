const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//Create a Sub Section
exports.createSubSection = async(req, res) => {
    try{
        //fetch data from Req body
        const {title, timeDuration, description, sectionId} = req.body;
        //extract file/video
        const videoFile = req.files.videoFile;
        //validation
        if(!title || !timeDuration || !description || !sectionId || !videoFile)
        {
            return res.status(404).json({
                success: false,
                message: "Missing Properties."
            });
        }


        //upload video to cloudinary -> Why? -> To obtain videoUrl which will be stored in SubSection Schema
        const uploadDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME); 
        console.log("Video Upload Details: ",uploadDetails);

        //create a sub Section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })

        //update Section with this sub section ObjectId
        const updateSection = await Section.findByIdAndUpdate(
                                                            { _id: sectionId },
                                                            {
                                                                $push: {
                                                                    subSection: subSectionDetails._id,
                                                                }
                                                            },
                                                            {new: true},
        );
        //HW:  Populate the subSection field to log the updated Section with details
        const populatedSection = await Section.findById(updateSection._id).populate('subSection');
        console.log('Updated Section:', populatedSection);


        //return response
        return res.status(200).json({
            success: true,
            message: "Sub-Section Created Successfully.",
            data: updateSection,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Creating Sub Section.",
        });
    }
}


//HW: update Sub Section
exports.updateSubSection = async (req, res) => {
    try{
        //get data and id
        const {sectionId, subSectionId, title, description} = req.body;
        //validation
        if(!subSectionId)
        {
            return res.status(404).json({
                success: false,
                message: "SubSection Not Found while Updating Sub-Section.",
              })
        }

        //update Sub-Section
        if(title !== undefined)
        {
            SubSection.title = title;
        }
        if(description !== undefined)
        {
            SubSection.description = description;
        }
        if (req.files && req.files.videoFile !== undefined) {
            const videoFile = req.files.videoFile;
            const uploadDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);
            SubSection.videoUrl = uploadDetails.secure_url
            SubSection.timeDuration = `${uploadDetails.duration}`
        }

        //Save the all the updation
        await SubSection.save();

        // find updated section and return it
        const updatedSectionDetails = await Section.findById(sectionId).populate("subSection");
        console.log("updated section", updatedSectionDetails);

        //return response
        return res.json({
            success: true,
            message: "Sub-Section updated successfully",
            data: updatedSectionDetails,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Updating Sub Section.",
        });
    }
}




//HW: Delete Sub Section
exports.deleteSubSection = async(req, res) => {
    try{
        //get id
        const {subSectionId, sectionId} = req.body;
        //validation
        if(!subSectionId || !sectionId)
        {
            return res.status(404).json({
                success: false,
                message: "SubSection or Section Not Found while Deleting Sub-Section.",
                })
        }

        //first delete the subSection ref from the section Model 
        await Section.findByIdAndUpdate(
                                        {_id: sectionId},
                                        {
                                            $pull: {
                                                subSection: subSectionId,
                                            },
                                        },
                                        {new: true},
        )

        //Now delete the actual sub section
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId});

        // find updated section and return it
        const updatedSectionDetails = await Section.findById(sectionId).populate("subSection");
        console.log("updated section", updatedSectionDetails);

        //return response
        return res.json({
            success: true,
            message: "Sub-Section Deleted successfully",
            data: updatedSectionDetails,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Deleting Sub Section.",
        });
    }
}