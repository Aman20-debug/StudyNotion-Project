const User = require("../models/User");
const Profile = require("../models/Profile");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const { JsonWebTokenError } = require("jsonwebtoken");
require("dotenv").config();

//sendotp
exports.sendOTP = async (req, res) => {
    try{

        //fetch email from request ki body
        const {email} = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({email});

        //if User already exist, then return a response
        if(checkUserPresent)
        {
            return res.status(401).json({
                success: false,
                message: "User already registered", 
            })
        }

        //generate Otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP Generated: ",otp);

        //check unique otp or not
        const result = await OTP.findOne({otp: otp});

        while(result)
        {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({otp: otp});
        }

        const otpPayload = {email, otp};

        //create an entry for db
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success: true,
            message: "Otp Sent Succesfully",
            otp,
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Sending OTP",
        });
    }
}

//signup
exports.signup = async (req, res) => {
    try{

        //fetch data;
        const {firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp} = req.body;
        //validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp)
        {
            return res.status(403).json({
                success: false,
                message: "All fields are required.",
            });
        }

        //2 Password match krlo
        if(password !== confirmPassword)
        {
            return res.status(400).json({
                success: false,
                message: "Password and confirmPassword Value does not match, please try again.",
            });
        }

        //check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser)
        {
            return res.status(400).json({
                success: false,
                message: "User is already registered.",
            });
        }

        //find most recent OTP stored for the user to check whether the user enter the correct otp or not 
        const recentOtp = await OTP.findOne({email}).sort({createdAt: -1}).limit(1);
        console.log("Recent OTP: ", recentOtp);  //recentOtp is the Otp send to the user via mail which was then stored in db
        //validate OTP
        if(recentOtp.length == 0)
        {
            //OTP Not Found
            return res.status(400).json({
                success: false,
                message: "OTP Not Found.",
            });
        }
        else if(otp !== recentOtp)
        {
            //Invalid OTP
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const profileDetails = await Profile.create({
            gender: null, 
            dateOfBirth: null, 
            about: null, 
            contactNumber: null, 
        });
        //entry create in db
        const user = await User.create({
            firstName, 
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        //return res
        return res.status(200).json({
            success: true,
            message: "User is Registered Successfully.",
            user,
        });



    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While SignUp",
        });
    }
}


//login
exports.login = async (req, res) => {
    try{
        //get data from req body
        const {email, password} = req.body;
        //validate data
        id(!email || !password)
        {
            return res.status(403).json({
                success: false,
                message: "All fields are required.",
            });   
        }
        //user exists or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user)
        {
            return res.status(401).json({
                success: false,
                message: "User is not registered, please try again.",
            });
        }
        
        //generate JWT, after password matching
        if(await bcrypt.compare(password, user.password))
        {
            const payload = {
                email: user.email,
                id: user._id,
                role: user.role,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            //create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged in Successfully.",
            })
        }
        else
        {
            return res.status(401).json({
                success: false,
                message: "Password is Incorrect.",
            })
        }

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error While Login",
        });
    }
}


//changePassword
exports.changePassword = async (req, res) => {
    try{
        //get data from req body
        //get oldPassword, newPassword, confirmPassword
        //validation

        //update password in db
        //send mail -> Password Updated
        //return response
    }
    catch(err){

    }
}