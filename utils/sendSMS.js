const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const client = require('twilio')(accountSid, authToken);
const readlines = require('readline')

function verifyTwilio() {
    client.verify.v2.services(verifySid).verifications.create({ to: "+917088980706", channel: "sms" })
        .then((verification) => console.log(verification.status))
        .then(() => {
            const readline = readlines.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            readline.question("Please enter the OTP:", (otpCode) => {
                client.verify.v2
                    .services(verifySid)
                    .verificationChecks.create({ to: "+917088980706", code: otpCode })
                    .then((verification_check) => console.log(verification_check.status))
                    .then(() => readline.close());
            });
        });
}

exports.sendOTPToSMS = (options, res) => {
    try {
        // verifyTwilio();
        client.messages.create({
            channel: "sms",
            body: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                "Please verify the following OTP, or paste this into our application to complete the process within 10 mins of receiving it:\n\n" +
                `OTP: BreakIN- ${options.otp}\n\n` +
                `This OTP is valid only upto 10 mins\n\n` +
                "If you did not request this, please ignore this email and your password will remain unchanged",
            // from: `${process.env.TWILIO_PHONE_NUMBER}`,
            from: "+917088980706",
            to: `+919675646087`
        }).then((message) => console.log(message.sid))
        console.log('OTP sent to phone number: ' + options.PhoneNumber + message.sid)

    } catch (error) {
        console.log(error.messages);
    }
}