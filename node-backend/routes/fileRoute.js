const express = require("express");
const multer = require("multer");

const { uploadFile, getFiles, deleteFile } = require("../controllers/fileController.js");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.delete("/:id", deleteFile);

// Use module.exports instead of export default
module.exports = router;
