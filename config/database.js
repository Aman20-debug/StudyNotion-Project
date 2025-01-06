const mongoose = require("mongoose");
require("dotenv").config();

const dbconnect = () => {
    mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then( () => console.log("DB ka Connection is Succesfull"))
    .catch( (error) => {
        console.log("Issue hai");
        console.log(error.message);
        process.exit(1);
    });
}

module.exports = dbconnect;  