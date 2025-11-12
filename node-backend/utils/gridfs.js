const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

let gfsBucket;

mongoose.connection.once("open", () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
  console.log("✅ GridFS Bucket initialized");
});

const getGfsBucket = () => gfsBucket;

module.exports = { getGfsBucket };
