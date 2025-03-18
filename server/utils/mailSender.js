const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
    try{

        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT, 
            secure: process.env.MAIL_SECURE === "true",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })

        let info = await transporter.sendMail({
            from: `"StudyNotion - by Aman" <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            text: "Your email client does not support HTML. Please enable HTML view.",
            html: body,  // ✅ Pass `body` directly instead of using string interpolation
        })
        console.log(info);
        return info;
    }
    catch(error){
        console.log(error.message);
        throw error;
    }
}


module.exports = mailSender;