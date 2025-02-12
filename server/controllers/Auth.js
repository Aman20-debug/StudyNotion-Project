const User = require("../models/User");
const Profile = require("../models/Profile");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {passwordUpdated}  = require("../mail_templates/PasswordUpdate");
require("dotenv").config();
const mailSender = require("../utils/mailSender");

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
            // Return 401 Unauthorized status code with error message
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
        const recentOtp = await OTP.findOne({email}).sort({createdAt: -1});
        console.log("Recent OTP: ", recentOtp);  //recentOtp is the Otp send to the user via mail which was then stored in db
        //validate OTP
        if(!recentOtp)
        {
            //OTP Not Found
            return res.status(400).json({
                success: false,
                message: "OTP Not Found.",
            });
        }
        else if(otp !== recentOtp.otp)
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
        if(!email || !password)
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
                accountType: user.accountType,
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
        //get userDetails from req body
        const userDetails = await User.findById(req.user.id);
        //get oldPassword, newPassword, confirmPassword
        const {oldPassword, password, confirmPassword} = req.body;

        //validate whether old Password is correct or not
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
        if(!isPasswordMatch)
        {
            return res.status(401).json({
                success: false,
                message: "The Password is Incoorect.",
            });
        }

        //password and confirmPassword validation
        if(password !== confirmPassword)
        {
            return res.status(401).json({
                success: false,
                message: "Password and confirmPassword did not match.",
            });
        }        
        
        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //update password in db
        const updateUserDetails = await User.findByIdAndUpdate(
                                                            req.user.id,
                                                            {
                                                                password: hashedPassword,
                                                            },
                                                            {new: true},
        )

        // Send notification email
        try{
            const emailResponse = await mailSender(
            updateUserDetails.email,
            "Password for your account has been updated",
            passwordUpdated(
                updateUserDetails.email,
                `Password updated successfully for ${updateUserDetails.firstName} ${updateUserDetails.lastName}`
            )
            )
            console.log("Email sent successfully:", emailResponse.response)
        }catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
            success: false,
            message: "Error occurred while sending email",
            })
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Password Changed Successfully.",
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Error While Changing Password.",
        })
    }
}

