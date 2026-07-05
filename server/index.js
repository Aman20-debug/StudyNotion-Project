// Load environment variables first
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const dbconnect = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");
const FRONTEND_URL = require("./utils/url.js");

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database and configure Cloudinary
dbconnect();
cloudinaryConnect();

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Middleware for uploading files to our server
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
}));

// Mount the API routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Default route
app.get("/", (req, res) => {
  res.send("<h1>This is HOMEPAGE Aman</h1>");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server Started Successfuly at, ${PORT}`);
});
