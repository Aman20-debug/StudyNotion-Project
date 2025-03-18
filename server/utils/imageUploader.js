const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Ensure .env variables are loaded

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        console.log("Uploading Image:", file.name);

        const tempPath = path.join(__dirname, "../uploads", file.name);
        await file.mv(tempPath);  // Move the file to uploads
        console.log("File moved to:", tempPath);

        const options = { folder };
        if (height) options.height = height;
        if (quality) options.quality = quality;
        options.resource_type = "auto";

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(tempPath, options);
        console.log("Cloudinary Upload Success:", result);

        // Remove temp file after upload
        fs.unlinkSync(tempPath);

        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};
