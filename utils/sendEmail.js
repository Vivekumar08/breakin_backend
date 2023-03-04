const nodemailer = require("nodemailer");
const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        secure: false,
        service: "gmail",
        auth: {
            user: `${process.env.EMAIL_ADDRESS}`, // generated ethereal user
            pass: `${process.env.EMAIL_PSSWD}`, // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: ` "Recovery Email from BreakIN" <${process.env.EMAIL_ADDRESS}>`,
        to: `${options.Email}`,
        subject: `BreakIN: OTP -${options.otp} to Reset Password`,
        text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please verify the following OTP, or paste this into our application to complete the process within 10 mins of receiving it:\n\n" +
            `OTP: BreakIN- ${options.otp}\n\n` +
            `This OTP is valid only upto 10 mins\n\n` +
            "If you did not request this, please ignore this email and your password will remain unchanged",
    };

    console.log("Sending email.....");

    transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
            console.log("There was an error: ", err);
        } else {
            console.log("There you Go: ", response);
        }
    });
};

module.exports = sendEmail;