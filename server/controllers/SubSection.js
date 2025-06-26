const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//Create a Sub Section
exports.createSubSection = async(req, res) => {
    console.log("CREATE SUBSECTION API HIT");
    try{
        //fetch data from Req body
        const {title, timeDuration, description, sectionId} = req.body;
        //extract file/video
        console.log("req.files: ", req.files)
        const videoFile = req.files.video;
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



// Delete a Sub Section from a Section
exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;

    // Validation
    if (!subSectionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID or Section ID is missing.",
      });
    }

    // Remove the subSection reference from the Section
    await Section.findByIdAndUpdate(
      sectionId,
      {
        $pull: {
          subSection: subSectionId,
        },
      },
      { new: true }
    );

    // Delete the actual SubSection document
    await SubSection.findByIdAndDelete(subSectionId);

    // Fetch updated section with populated subsections
    const updatedSection = await Section.findById(sectionId).populate("subSection");

    // Return the updated section
    return res.status(200).json({
      success: true,
      message: "Sub-Section deleted successfully.",
      data: updatedSection,
    });
  } catch (err) {
    console.error("Error deleting subsection:", err);
    return res.status(500).json({
      success: false,
      message: "Error while deleting sub-section.",
    });
  }
};
