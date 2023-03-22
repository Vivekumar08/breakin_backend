const generatedOTPs = new Map();
exports.generateOTP = (id=null) => {
    var otp
    // Keep generating OTPs until we find one that hasn't been generated before
    do {
        otp = Math.floor(Math.random() * 9000) + 1000;
    } while (generatedOTPs.has(otp));

    // Add the generated OTP to the set
    const expirationTime = Date.now() + 10 * 60 * 1000;
    generatedOTPs.set(otp, expirationTime, id);

    return otp;
}
