const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");

const router = express.Router();

const userP = require("../model/userProfile");

router.get("/getdata", async (req, res) => {
    const details = await userP.find();
    res.status(200).json(details);
});

router.post("/NewUser", async(req, res) => {
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

module.exports = router;