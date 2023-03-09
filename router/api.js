const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")

const router = express.Router();
const multer = require("multer");
const {
    GridFsStorage
} = require("multer-gridfs-storage");
const userP = require("../model/user/userProfile");
const ownerP = require("../model/owner/ownerProfile");
const RatePlace = require("../model/user/ratePlace");
const SuggestPlace = require("../model/user/suggestPlace");
const HelpUser = require("../model/user/help");
const FeedBackUser = require("../model/user/feedback");
const MenuItemOwner = require("../model/owner/menu");
const listPlace = require("../model/owner/listPlace");
const sendEmail = require("../utils/sendEmail");
const { generateOTP, isOTPValid } = require("../utils/otpGenerator");
const { sendOTPToSMS } = require("../utils/sendSMS");


let bucket;
mongoose.connection.on("connected", () => {
    var db = mongoose.connections[0].db;
    bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "newBucket"
    });
    console.log("File Bucket created successfully");
});


const storage = new GridFsStorage({
    url: process.env.DATABASE,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = `${new Date().getTime()}_${file.originalname}`;
            const fileInfo = {
                filename: filename,
                bucketName: "newBucket"
            };
            resolve(fileInfo);
        });
    }
});

const upload = multer({
    storage
});

router.get("/fileinfo/:filename", (req, res) => {
    const file = bucket
        .find({
            filename: req.params.filename
        })
        .toArray((err, files) => {
            if (!files || files.length === 0) {
                return res.status(404)
                    .json({
                        err: "no files exist"
                    });
            }
            bucket.openDownloadStreamByName(req.params.filename)
                .pipe(res);
        });
});
router.get("/file/:filename", (req, res) => {
    console.log(req.params.filename)
    try {

        const file = bucket
            .find({
                filename: req.params.filename
            })
            .toArray((err, files) => {
                if (!files || files.length === 0) {
                    return res.status(404)
                        .json({
                            err: "no files exist"
                        });
                }
                res.status(200).json(files)
            });
    } catch (err) {
        console.log(err)
    }
});
router.get("/file", (req, res) => {
    const file = bucket
        .find()
        .toArray((err, files) => {
            if (!files || files.length === 0) {
                return res.status(404)
                    .json({
                        err: "no files exist"
                    });
            }
            res.status(200).json({ success: true, files })
        });
});

router.post("/upload", upload.single("file"), (req, res) => {
    res.status(200)
        .send("File uploaded successfully");
});

// Check if token is valid
router.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.header("x-auth-token");
        if (!token) return res.status(204).json(false);
        const verified = jwt.verify(token, process.env.SECRET);
        if (!verified) return res.status(201).json(false);
        const user = await userP.findById(verified.id);
        if (!user) return res.status(202).json(false);
        return res.json(true);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/user/getdata", async (req, res) => {
    const details = await userP.findById(req.user);
    res.status(200).json(details);
});


router.post("/user/registerWithEmail", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, Email, Password } = req.body;;

        if (!Email || !Password) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        if (Password.length < 5) return res.status(400).json({ msg: "The password needs to be at least 5 characters." })

        const existingUser = await userP.findOne({ Email: Email })
        if (existingUser) return res.status(400).json({ msg: "An account with this email already exists." })

        const hashedPassword = await bcrypt.hash(Password, salt);

        const user = new userP({
            FullName: FullName,
            Email: Email,
            Password: hashedPassword,
        });

        const savedUser = await user.save();

        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '7d' })

        res.status(200).cookie("token", token).json({ token, savedUser })
        // return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
});

router.post("/user/registerWithNumber", async (req, res) => {
    try {
        const { FullName, PhoneNumber } = req.body;;

        if (!PhoneNumber) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        const existingUser = await userP.findOne({ PhoneNumber: PhoneNumber })
        if (existingUser) return res.status(400).json({ msg: "An account with this phone number already exists." })
        const otp = generateOTP(req.user)
        console.log(otp)
        const user = new userP({
            FullName: FullName,
            PhoneNumber,
            resetPasswordOTP: otp
        });
        await user.save();
        const code = sendOTPToSMS({ otp, PhoneNumber }, res);
        console.log(code)
        // const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '7d' })
        // res.status(200).json({ token, savedUser })
        // return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        res.status(500).json({ error: err.message });
        // console.log(err);
    }
});

router.post("/user/forgotEmail", async (req, res) => {
    try {
        const { Email } = req.body;
        if (!Email) {
            return res.status(400).json({ error: "email require" });
        }
        const user = await userP.findOne({ Email: Email });
        console.log(user.id)

        if (!user) {
            return res.status(400).json({ error: "email not in the database" });
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

router.put("/user/verifyOTPviaEmail", async (req, res) => {
    try {
        const { otp,Email } = req.body;
        const details = await userP.findOne({Email: Email});
        console.log(details)
        if (isOTPValid.has(otp, details.id)) {
            const expirationTime = isOTPValid.get(otp);
            const currentTime = Date.now();
            if (details) {
                if (expirationTime > currentTime) {
                    if (details.resetPasswordOTP == otp) {
                        const data = await details.updateOne({
                            PreviousPassword: details.Password,
                            resetPasswordOTP: null,
                            resetPasswordExpires: null,
                        })
                        if (data) {
                            // console.log('password updated');
                            res.status(200).json({ msg: "OTP verified" })
                        } else {
                            // console.log("Password can't be update")
                            res.status(403).json("Password can't be update");
                        }
                    }
                    return true;
                } else {
                    isOTPValid.delete(otp);
                    res.status(400).json({ msg: "We cannot verify the otp" })
                }
            } else {
                res.status(400).json({ msg: "We cannot verify the otp" })
            }
        }
    } catch (error) {
    }
})

router.put("/user/updatePasswordViaEmail", auth, async (req, res) => {
    try {
        // 
        const { Password, Email } = req.body;


        const details = await userP.findOne({Email: Email});
        if (details) {
            const salt = await bcrypt.genSalt();

            // console.log('User exists in the database')
            const hashedPassword = await bcrypt.hash(Password, salt);
            const data = await details.updateOne({
                Password: hashedPassword,
                resetPasswordOTP: null,
                resetPasswordExpires: null,
            });
            if (data) {
                // console.log('password updated');
                res.status(200).json({ msg: "password updated" });
            } else {
                // console.log("Password can't be update")
                res.status(403).json({error:"Password can't be update"});
            }
        } else {
            // console.log('no user exists in db to update')
            res.status(404).json({error:"no user exists in db to update"});
        }
    } catch (err) {
        console.log("err");
    }
});

router.post("/user/loginWithEmail", async (req, res) => {
    try {
        const { Email, Password } = req.body;
        if (!Email || !Password) {
            return res
                .status(400)
                .json({ error: "Fill the Admin Login Form Properly" });
        }

        const UserLogin = await userP.findOne({ Email: Email });
        //   const UserLogin = await User.findOne({ FullName: FullName_ })

        if (UserLogin) {
            const isMatch = await bcrypt.compare(Password, UserLogin.Password);
            // console.log(isMatch)
            if (!isMatch) {
                console.log("Invalid Credentials");
                res.status(400).json({ msg: "Invalid Credentials." });
            } else {
                const token = jwt.sign({ id: UserLogin._id }, process.env.SECRET, { expiresIn: '30d' })
                // res.status(200).json({ token, UserLogin });
                // const token = jwt.sign({id: UserLogin._id},process.env.SECRET)
                console.log(token)
                res.status(200).header("x-auth-token", token).cookie(token).json({ token, UserLogin });

                console.log("Signin Successful");
                await UserLogin.save();
            }
        } else {
            console.log("Login Failed");
            res.status(400).json({ msg: "No account with this email has been regiestered." });
        }
    } catch (err) {
        console.log(err);
    }
});


router.delete("/user/delete", auth, async (req, res) => {
    try {
        const delete_user = await userP.findByIdAndDelete(req.user);
        res.json(delete_user + "User deleted");

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

// Update User Profile
router.post("/user/updateProfile", auth, async (req, res) => {
    try {
        const { Name, Phone, Email, Location } = req.body();
        if (!Name, !Phone, !Email, !Location) return res.status(400).json({ msg: "Can not be updated your profile with incomplete information" })
        const data = await userP.findOneAndUpdate({ _id: req.user }, {
            $set: {
                FullName: Name,
                Email: Email,
                PhoneNumber: Phone,
                location: Location
            },
        })
        if (data) {
            res.status(200).send("Profile updated successfully.");
        } else {
            res.status(401).send("Unable to update, No data found");
        }
    } catch (error) {
        console.log("server error")
    }
})

// User Profile Picture

router.post("/user/profilePic", auth, upload.single("file"), async (req, res) => {
    try {
        const { filename, mimetype } = req.file;
        console.log(filename, mimetype)
        const data = await userP.findOneAndUpdate({ _id: req.user }, {
            $set: {
                "Profile.file_path": {
                    file_path1: filename,
                    file_mimetype1: mimetype,
                },
            },
        });
        if (data) {
            // console.log(dat)
            res.status(200).send("file uploaded successfully.");
        } else {
            res.status(401).send("Unable to upload CV, No data found");
        }
        // console.log(dat)
    } catch (error) {
        console.log(error);
        res.status(402).send("Error while uploading file. Try again later.");
    }
});

// FeedBack User
router.post('/user/feedbackUser', auth, async (req, res) => {
    const { Message } = req.body();
    try {
        if (!Message) {
            res.status(400).json({ msg: "Write a message to give proper feedback." })
        }

        const feedbackUser = new FeedBackUser({
            Message
        });
        const savedUser = await feedbackUser.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

// Help User
router.post('/user/HelpUser', auth, async (req, res) => {
    const { Name, Email, Message } = req.body();
    try {
        if (!Name, !Email, !Message) {
            res.status(400).json({ msg: "We won't be able to you if you filled incomplete information" })
        }
        const menuItems = new HelpUser({
            Name, Email, Message
        });
        const savedUser = await menuItems.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

// Rate Place
router.post('/user/ratePlace', auth, async (req, res) => {
    const { OverallRating, Hygiene, Taste, Quality, Ambience, Comment } = req.body();
    try {
        if (!OverallRating, !Hygiene, !Taste, !Quality, !Ambience, !Comment) {
            res.status(400).json({ msg: "You can not rate this place with incomplete information" })
        }

        const ratePlace = new RatePlace({
            OverallRating, Hygiene, Taste, Quality, Ambience, Comment
        });
        const savedUser = await ratePlace.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

// Suggest a Place
router.post('/user/suggestPlace', auth, async (req, res) => {
    const { PlaceName, Address, Contact, } = req.body();
    try {
        if (!PlaceName, !Address, !Contact) {
            res.status(400).json({ msg: "You can not suggest a place without complete information" })
        }

        const suggestPlace = new SuggestPlace({
            PlaceName, Address, Contact
        });
        const savedUser = await suggestPlace.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

// Owner Profile

router.get("/owner/getdata", auth, async (req, res) => {
    const details = await ownerP.findById(req.user);
    res.status(200).json(details);
});



router.post("/owner/loginWithEmail", async (req, res) => {
    try {
        const { Email, Password } = req.body;
        if (!Email || !Password) {
            return res
                .status(400)
                .json({ error: "Fill the Admin Login Form Properly" });
        }

        const UserLogin = await ownerP.findOne({ Email: Email });
        //   const UserLogin = await User.findOne({ FullName: FullName_ })

        if (UserLogin) {
            const isMatch = await bcrypt.compare(Password, UserLogin.Password);
            // console.log(isMatch)
            if (!isMatch) {
                console.log("Invalid Credentials");
                res.status(400).json({ msg: "Invalid Credentials." });
            } else {
                const token = jwt.sign({ id: UserLogin._id }, process.env.SECRET)
                res.status(200).cookie("token", token).json({ token, UserLogin });
                console.log("Signin Successful");
                await UserLogin.save();
            }
        } else {
            console.log("Login Failed");
            res.status(400).json({ msg: "No account with this email has been regiestered." });
        }
    } catch (err) {
        console.log(err);
    }
});


router.post("/owner/registerWithEmail", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, Email, Password } = req.body;

        if (!FullName || !Email || !Password) {
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

        // return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
});

router.post("/user/registerWithNumber", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, PhoneNumber } = req.body;;

        if (!PhoneNumber) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        const existingUser = await userP.findOne({ PhoneNumber: PhoneNumber })
        if (existingUser) return res.status(400).json({ msg: "An account with this phone number already exists." })
        const user = new userP({
            FullName: FullName,
            PhoneNumber
        });
        const savedUser = await user.save();
        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '7d' })
        res.status(200).cookie("token", token).json({ token, savedUser })
        // return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
});


router.post("/owner/forgotEmail", async (req, res) => {
    try {
        const { Email } = req.body;
        if (!Email) {
            return res.status(400).json({error:"email require"});
        }
        const user = await ownerP.findOne({ Email: Email });
        if (!user) {
            return res.status(401).json({error:"email not in the database"});
        } else {
            const otp = generateOTP(user.id)
            const up = await user.updateOne({
                resetPasswordOTP: otp,
                resetPasswordExpires: Date.now() + 10 * 60 * 1000,
            });
            if (up) {
                sendEmail({ otp, Email })

            } else {
                console.log("Unable to give token ");
            }
        }
    } catch (err) {
        console.log(" External err", err);
    }
});

router.put("/owner/verifyOTPviaEmail", async (req, res) => {
    try {
        const { otp, Email } = req.body;
        const details = await ownerP.findOne({ Email: Email});
        if (isOTPValid.has(otp, details.id)) {
            const expirationTime = isOTPValid.get(otp);
            const currentTime = Date.now();
            if (details) {
                if (expirationTime > currentTime) {
                    if (details.resetPasswordOTP == otp) {
                        const data = await details.updateOne({
                            PreviousPassword: details.Password,
                            resetPasswordOTP: null,
                            resetPasswordExpires: null,
                        })
                        if (data) {
                            // console.log('password updated');
                            res.status(200).json({ msg: "OTP verified" })
                        } else {
                            // console.log("Password can't be update")
                            res.status(403).json({error:"Password can't be update"});
                        }
                    }
                    return true;
                } else {
                    isOTPValid.delete(otp);
                    res.status(400).json({ error: "We cannot verify the otp" })
                }
            } else {
                res.status(400).json({ error: "We cannot verify the otp" })
            }
        }
    } catch (error) {
    }
})

router.put("/owner/updatePasswordViaEmail",  async (req, res) => {
    try {
        // 
        const { Password, Email } = req.body;


        const details = await ownerP.findOne({Email: Email});
        if (details) {
            const salt = await bcrypt.genSalt();

            // console.log('User exists in the database')
            const hashedPassword = await bcrypt.hash(Password, salt);
            const data = await details.updateOne({
                Password: hashedPassword,
                resetPasswordOTP: null,
                resetPasswordExpires: null,
            });
            if (data) {
                // console.log('password updated');
                res.status(200).json({ message: "password updated" });
            } else {
                // console.log("Password can't be update")
                res.status(403).json({error:"Password can't be update"});
            }
        } else {
            // console.log('no user exists in db to update')
            res.status(404).json({error:"no user exists in db to update"});
        }
    } catch (err) {
        console.log("err");
    }
});


router.delete("/owner/delete", auth, async (req, res) => {
    const delete_user = await ownerP.findOneAndDelete({ _id: req.user });
    res.send(delete_user + "User deleted");
});

router.post("/owner/menuItems", auth, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg } = req.body()
        if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
        const menuItems = new MenuItemOwner({
            OwnerId: req.user, ItemName, Price, Category, Ingredients, isVeg
        });
        const savedUser = await menuItems.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("err");

    }
})

router.post("/owner/menuItems", auth, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg } = req.body()
        if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
        const menuItems = await MenuItemOwner.findOneAndUpdate({ _id: req.user }, {
            $set: { ItemName: ItemName, Price: Price, Category: Category, Ingredients: Ingredients, isVeg: isVeg }
        })
        if (menuItems) {
            res.status(200).send("Menu Items updated successfully.");
        } else {
            res.status(401).send("Unable to update, No data found");
        }
    } catch (error) {
        console.log("err");

    }
})

// Owner List Place
router.post("/owner/listPlace", auth, upload.single("file"), async (req, res) => {
    try {
        const { PlaceName, Address, OwnerName } = req.body;
        const { filename, mimetype } = req.file;

        if (!PlaceName, !Address, !OwnerName) return res.json({ msg: "We can not list a place without improper information." })
        const user = new listPlace({
            PlaceName, Address, OwnerName, document: filename, mimetype: mimetype
        });

        const savedUser = await user.save();
        res.status(200).json({ savedUser, msg: "Place listed successfully." })

    } catch (error) {
        res.status(500).json({ err: error })
    }
})

module.exports = router;