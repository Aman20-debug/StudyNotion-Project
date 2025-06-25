const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// console.log("Cloudinary Credentials:", {
//     CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
//     API_KEY: process.env.CLOUDINARY_API_KEY,
//     API_SECRET: process.env.CLOUDINARY_API_SECRET,
//     FOLDER_NAME: process.env.FOLDER_NAME
// });


//load config from env file
require("dotenv").config();
const PORT = process.env.PORT || 5000;

//connect to the database
const dbconnect = require("./config/database");
dbconnect();


//Middleware 
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));


//middleware for uploading file into our server
const fileupload = require("express-fileupload");
app.use(fileupload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
})); 


//mount the API routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

//start server
app.listen(PORT, () => {
    console.log(`Server Started Successfuly at, ${PORT}`);
})


//default route
app.get("/", (req, res) => {
  res.send("<h1>This is HOMEPAGE Aman</h1>");
});