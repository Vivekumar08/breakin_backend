const generatedOTPs = new Map();
exports.generateOTP = (id) => {
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

exports.isOTPValid = (otp,id) => {
    // Check if the OTP exists and has not expired
    if (generatedOTPs.has(otp, id)) {
        const expirationTime = generatedOTPs.get(otp);
        const currentTime = Date.now();
        if (id == req.user) {
            if (expirationTime > currentTime) {
                return true;
            } else {
                generatedOTPs.delete(otp);
            }
        } else {
            generatedOTPs.delete(otp);
        }
    }
    return false;
}
