const mongoose = require("mongoose");
const multer = require("multer");
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' })

const {
    GridFsStorage
} = require("multer-gridfs-storage");

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

module.exports = upload;