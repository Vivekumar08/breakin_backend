const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")

const ownerRouter = express.Router();
const ownerP = require("../model/owner/ownerProfile");
const FeedBackUser = require("../model/user/feedback");
const sendEmail = require("../utils/sendEmail");
const { generateOTP } = require("../utils/otpGenerator");
// const { sendOTPToSMS } = require("../utils/sendSMS");
const upload = require("../utils/bucket");


ownerRouter.get("/getdata", auth, async (req, res) => {
    console.log(req.user);
    const details = await ownerP.findById(req.user);
    res.status(200).json(details);
});


ownerRouter.post("/registerWithEmail", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, Email, Password } = req.body;;

        if (!Email || !Password) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        if (Password.length < 5) return res.status(400).json({ msg: "The password needs to be at least 5 characters." })

        const existingUser = await ownerP.findOne({ Email: Email })
        if (existingUser) return res.status(400).json({ msg: "An account with this email already exists." })

        const hashedPassword = await bcrypt.hash(Password, salt);

        const user = new ownerP({
            FullName: FullName,
            Email: Email,
            Password: hashedPassword,
        });

        const savedUser = await user.save();

        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '7d' })

        res.status(200).cookie("token", token).json({ token, savedUser })
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
});

// ownerRouter.post("/registerWithNumber", async (req, res) => {
//     try {
//         const { FullName, PhoneNumber } = req.body;;

//         if (!PhoneNumber) {
//             return res.status(400).json({ error: "Fill the complete form" });
//         }
//         const existingUser = await ownerP.findOne({ PhoneNumber: PhoneNumber })
//         if (existingUser) return res.status(400).json({ msg: "An account with this phone number already exists." })
//         const otp = generateOTP(req.user)
//         console.log(otp)
//         const user = new ownerP({
//             FullName: FullName,
//             PhoneNumber,
//             resetPasswordOTP: otp
//         });
//         await user.save();
//         sendOTPToSMS({ otp, PhoneNumber }, res);
//         return res.status(200).json({ msg: "Form filled Successfully " });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

ownerRouter.post("/forgotEmail", async (req, res) => {
    try {
        const { Email } = req.body;
        if (!Email) {
            return res.status(400).json({ error: "email require" });
        }
        const user = await ownerP.findOne({ Email: Email });
        if (!user) {
            return res.status(401).json({ error: "email not in the database" });
        } else {
            const otp = generateOTP(user.id)
            const up = await user.updateOne({
                resetPasswordOTP: otp,
                resetPasswordExpires: Date.now() + 10 * 60 * 1000,
            });
            if (up) {
                sendEmail({ otp, Email })
                return res.status(200).json({ msg: "OTP Sent" });
            } else {
                console.log("Unable to give token ");
            }
        }
    } catch (err) {
        console.log(" External err", err);
    }
});
ownerRouter.put("/resendOTPviaEmail", async (req, res) => {
    try {
        const { Email } = req.body;
        if (!Email) {
            return res.status(400).json({ error: "email require" });
        }
        const user = await ownerP.findOne({ Email: Email });
        if (!user) {
            return res.status(401).json({ error: "email not in the database" });
        } else {
            if (user.resetPasswordOTP) {
                const otp = user.resetPasswordOTP
                const up = await user.updateOne({
                    resetPasswordOTP: otp,
                    resetPasswordExpires: Date.now() + 10 * 60 * 1000,
                })
                if (up) {
                    sendEmail({ otp, Email })
                    return res.status(200).json({ msg: "OTP Sent" });
                } else {
                    res.status(403).json({ error: "Unable to send otp " });
                }
            } else {
                res.status(402).json({ error: "First, generate your OTP" });

            }
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

ownerRouter.put("/verifyOTPviaEmail", async (req, res) => {
    try {
        const { otp, Email } = req.body;
        const details = await ownerP.findOne({ Email: Email });
        const currentTime = Date.now();
        if (details) {
            if (details.resetPasswordExpires > currentTime) {
                if (details.resetPasswordOTP === otp) {
                    const data = await details.updateOne({
                        previousPasswd: details.Password,
                        resetPasswordOTP: null,
                        resetPasswordExpires: null,
                    })
                    console.log(data)
                    if (data) {
                        return res.status(200).json({ msg: "OTP verified" })
                    } else {
                        return res.status(403).json({ error: "Password can't be update" });
                    }
                }
                return res.status(403).json({ error: "Wrong OTP" });
            } else {
                return res.status(400).json({ error: "We cannot verify the otp" })
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

ownerRouter.put("/updatePasswordViaEmail", async (req, res) => {
    try {
        // 
        const { Password, Email } = req.body;


        const details = await ownerP.findOne({ Email: Email });
        if (details) {
            const salt = await bcrypt.genSalt();

            const hashedPassword = await bcrypt.hash(Password, salt);
            const data = await details.updateOne({
                Password: hashedPassword,
                resetPasswordOTP: null,
                resetPasswordExpires: null,
            });
            if (data) {
                res.status(200).json({ msg: "password updated" });
            } else {
                res.status(403).json({ error: "Password can't be update" });
            }
        } else {
            res.status(404).json({ error: "no user exists in db to update" });
        }
    } catch (err) {
        console.log("err");
    }
});

ownerRouter.post("/loginWithEmail", async (req, res) => {
    try {
        const { Email, Password } = req.body;
        if (!Email || !Password) {
            return res
                .status(400)
                .json({ error: "Fill the Admin Login Form Properly" });
        }

        const UserLogin = await ownerP.findOne({ Email: Email });

        if (UserLogin) {
            const isMatch = bcrypt.compare(Password, UserLogin.Password);
            if (!isMatch) {
                res.status(400).json({ msg: "Invalid Credentials." });
            } else {
                const token = jwt.sign({ id: UserLogin._id }, process.env.SECRET, { expiresIn: '30d' })
                res.status(200).header("x-auth-token", token).cookie(token).json({ token, UserLogin });
            }
        } else {
            console.log("Login Failed");
            res.status(400).json({ msg: "No account with this email has been regiestered." });
        }
    } catch (err) {
        console.log(err);
    }
});


ownerRouter.delete("/delete", auth, async (req, res) => {
    try {
        const delete_user = await ownerP.findByIdAndDelete(req.user);
        res.json(delete_user + "User deleted");

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

// Update User Profile
ownerRouter.post("/updateProfile", auth, async (req, res) => {
    try {
        const { Name, Phone, Email, Location } = req.body;
        if (!Name, !Phone, !Email, !Location) return res.status(400).json({ msg: "Can not be updated your profile with incomplete information" })
        const data = await ownerP.findOneAndUpdate({ _id: req.user }, {
            $set: {
                FullName: Name,
                Email: Email,
                PhoneNumber: Phone,
                location: Location
            },
        })
        if (data) {
            res.status(200).send({ msg: "Profile updated successfully." });
        } else {
            res.status(401).send({ error: "Unable to update, No data found" });
        }
    } catch (error) {
        console.log("server error")
    }
})

// User Profile Picture

ownerRouter.post("/profilePic", auth, upload.single("file"), async (req, res) => {
    try {
        const { filename, mimetype } = req.file;
        console.log(filename, mimetype)
        const data = await ownerP.findOneAndUpdate({ _id: req.user }, {
            $set: {
                profilePic: filename,
                profilePicMimetype: mimetype
            },
        });
        if (data) {
            res.status(200).send({ msg: "file uploaded successfully.", filename: filename });
        } else {
            res.status(401).send({ error: "Unable to upload CV, No data found" });
        }
    } catch (error) {
        console.log(error);
        res.status(402).send({ error: "Error while uploading file. Try again later." });
    }
});

// FeedBack Owner
ownerRouter.post('/feedbackUser', auth, async (req, res) => {
    const { Message } = req.body;
    try {
        if (!Message) {
            res.status(400).json({ msg: "Write a message to give proper feedback." })
        }

        const details = await ownerP.findById(req.user)
        const feedbackUser = new FeedBackUser({
            Message, role: "Owner", userOwner: details
        });
        const savedUser = await feedbackUser.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

// Help Owner
ownerRouter.post('/HelpUser', auth, async (req, res) => {
    const { Name, Email, Message } = req.body;
    try {
        if (!Name, !Email, !Message) {
            res.status(400).json({ msg: "We won't be able to you if you filled incomplete information" })
        }
        const details = await ownerP.findById(req.user)
        const help = new HelpUser({
            Name, Email, Message,  role: "Owner",userOwner: details
        });
        const savedUser = await help.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})


module.exports = ownerRouter;