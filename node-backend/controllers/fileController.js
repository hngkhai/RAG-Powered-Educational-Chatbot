const File = require("../models/File");
const Chapter = require("../models/Chapter");
const { ObjectId } = require("mongodb");
const { getGfsBucket } = require("../utils/gridfs");

// Upload File
const uploadFile = async (req, res) => {
  try {
    const gfsBucket = getGfsBucket();
    if (!gfsBucket) return res.status(500).json({ error: "DB not ready" });

    const { studentId, courseId, chapterId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });

    // 1. Stream to GridFS
    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { studentId, courseId, chapterId },
    });

    uploadStream.end(file.buffer);

    // === THE FIX IS HERE ===
    // Remove 'uploadedFile' from the callback arguments. It is undefined.
    uploadStream.on("finish", async () => {
      
      // 2. Create Mongoose Record
      const newFile = new File({
        filename: file.originalname,  // Use 'file' from the request scope
        mimetype: file.mimetype,      // Use 'file' from the request scope
        gridFsId: uploadStream.id,    // <--- GET ID FROM THE STREAM OBJECT
        studentId,
        courseId,
        chapterId,
      });

      await newFile.save();

      // 3. Link to Chapter
      chapter.filesIds.push(newFile._id);
      await chapter.save();

      res.status(200).json({
        message: "File uploaded successfully",
        file: newFile, 
      });
    });
    // =======================

    uploadStream.on("error", (error) => {
      console.error("Error during file upload:", error);
      res.status(500).json({ error: "Internal server error during upload" });
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Get Files (Query Mongoose, NOT GridFS)
const getFiles = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (chapterId) query.chapterId = chapterId;

    // Query the Metadata Collection directly
    const files = await File.find(query);

    if (!files.length) return res.status(404).json({ error: "No files found." });

    res.status(200).json({ files });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Fetch failed" });
  }
};

// Delete File (Safe Delete using Mongoose ID)
const deleteFile = async (req, res) => {
  const { id } = req.params; // This is now the Mongoose ID

  try {
    const gfsBucket = getGfsBucket();
    
    // 1. Find the Mongoose Document first
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ error: "File not found" });

    // 2. Delete from GridFS using the stored gridFsId
    const gridFsId = new ObjectId(fileDoc.gridFsId);
    await gfsBucket.delete(gridFsId);

    // 3. Delete from Mongoose Collection
    await File.findByIdAndDelete(id);

    // 4. Remove reference from Chapter
    await Chapter.findByIdAndUpdate(fileDoc.chapterId, {
      $pull: { filesIds: id },
    });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

module.exports = { uploadFile, getFiles, deleteFile };