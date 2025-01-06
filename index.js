const express = require("express");
const app = express();

//load config from env file
require("dotenv").config();
const PORT = process.env.PORT || 4000;

//cookie-parser -> What is this and why need this?

//Middleware to parse json request body
app.use(express.json());

//import routes
const user = require("./routes/user");
//mount the API routes
app.use("/api/v1", user);

//start server
app.listen(PORT, () => {
    console.log(`Server Started Successfuly at, ${PORT}`);
})

//connect to the database
const dbconnect = require("./config/database");
dbconnect();

//default route
app.get("/", (req, res) => {
    res.send(`<h1> This is HOMEPAGE Aman</h1>`);
})
