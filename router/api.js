const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const router = express.Router();
const multer = require("multer");
const {
    GridFsStorage
} = require("multer-gridfs-storage");
const userP = require("../model/userProfile");
const ownerP = require("../model/ownerProfile");

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
            const filename = file.originalname;
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
            res.status(200).json({ success: true, files })
        });
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


router.get("/getdata", async (req, res) => {
    const details = await userP.find();
    res.status(200).json(details);
});


router.post("/New_User_via_Email", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, Email, Password } = req.body;;

        if (!FullName || !Email || !Password) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        const hashedPassword = await bcrypt.hash(Password, salt);

        const user = new userP({
            FullName: FullName,
            Email: Email,
            Password: hashedPassword,
        });
        await user.save();
        return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        console.log(err);
    }
});


router.post("/User_login_with_email", async (req, res) => {
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
                res.status(402).json({ error: "Invalid Credentials" });
            } else {
                console.log("Signin Successful");
                res.status(200).json({ message: "user Signin Sucessfully" });
                await UserLogin.save();
            }
        } else {
            console.log("Login Failed");
            res.status(401).json({ error: "Login Failed" });
        }
    } catch (err) {
        console.log(err);
    }
});


router.delete("/delete/:id", async (req, res) => {
    const delete_user = await userP.findOneAndDelete({ _id: req.params.id });
    res.send(delete_user + "User deleted");
});

router.get("/getdata", async (req, res) => {
    const details = await ownerP.find();
    res.status(200).json(details);
});


router.post("/New_User_via_Email", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const { FullName, Email, Password } = req.body;;

        if (!FullName || !Email || !Password) {
            return res.status(400).json({ error: "Fill the complete form" });
        }
        const hashedPassword = await bcrypt.hash(Password, salt);

        const user = new ownerP({
            FullName: FullName,
            Email: Email,
            Password: hashedPassword,
        });
        await user.save();
        return res.status(200).json({ message: "Form filled Successfully " });
    } catch (err) {
        console.log(err);
    }
});


router.post("/User_login_with_email", async (req, res) => {
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
                res.status(402).json({ error: "Invalid Credentials" });
            } else {
                console.log("Signin Successful");
                res.status(200).json({ message: "user Signin Sucessfully" });
                await UserLogin.save();
            }
        } else {
            console.log("Login Failed");
            res.status(401).json({ error: "Login Failed" });
        }
    } catch (err) {
        console.log(err);
    }
});


router.delete("/delete/:id", async (req, res) => {
    const delete_user = await ownerP.findOneAndDelete({ _id: req.params.id });
    res.send(delete_user + "User deleted");
});


module.exports = router;