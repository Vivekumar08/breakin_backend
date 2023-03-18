const express = require("express");
const fileRouter = express.Router();
const mongoose = require("mongoose");

let bucket;
mongoose.connection.on("connected", () => {
    var db = mongoose.connections[0].db;
    bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "newBucket"
    });
});

fileRouter.get("/fileinfo/:filename", (req, res) => {
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
fileRouter.get("/file/:filename", (req, res) => {
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
fileRouter.get("/file", (req, res) => {
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


fileRouter.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) return res.status(204).json(false);
        const verified = jwt.verify(token, process.env.SECRET);
        if (!verified) return res.status(201).json(false);
        return res.json(true);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = fileRouter