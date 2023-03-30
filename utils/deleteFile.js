const mongoose = require("mongoose")

let bucket;
mongoose.connection.on("connected", () => {
    var db = mongoose.connections[0].db;
    bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "newBucket"
    });
    // console.log("File Bucket");
});

const deleteFile = async (filename) => {
    try {
        const documents = await bucket.find({ filename: filename }).toArray();
        if (documents.length === 0) {
            throw new Error('FileNotFound');
        }
        return Promise.all(
            documents.map((doc) => {
                return bucket.delete(doc._id);
            })
        );
    } catch (err) {
        console.log(err)
    }
}

module.exports = deleteFile;