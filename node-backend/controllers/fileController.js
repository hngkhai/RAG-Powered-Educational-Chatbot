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
    // We add student/course/chapter info to metadata so we can query GridFS directly later
    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { studentId, courseId, chapterId },
    });

    uploadStream.end(file.buffer);

    uploadStream.on("finish", async () => {
      // 2. Update Chapter directly (No separate File Schema)
      const fileData = {
        fileId: uploadStream.id, // The GridFS ID
        filename: file.originalname,
        mimetype: file.mimetype,
      };

      chapter.filesIds.push(uploadStream.id);
      await chapter.save();

      res.status(200).json({
        message: "File uploaded successfully",
        // Return a structure matching what the frontend expects
        file: {
          _id: uploadStream.id, 
          filename: file.originalname,
          mimetype: file.mimetype
        }, 
      });
    });

    uploadStream.on("error", (error) => {
      console.error("Error during file upload:", error);
      res.status(500).json({ error: "Internal server error during upload" });
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Get Files (Query GridFS directly)
const getFiles = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.query;
    const gfsBucket = getGfsBucket();

    // Build query based on the metadata we saved during upload
    const query = {};
    if (studentId) query["metadata.studentId"] = studentId;
    if (courseId) query["metadata.courseId"] = courseId;
    if (chapterId) query["metadata.chapterId"] = chapterId;

    // Find directly in GridFS collection
    const filesCursor = gfsBucket.find(query);
    const files = await filesCursor.toArray();

    if (!files.length) return res.status(200).json({ files: [] });

    res.status(200).json({ files });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Fetch failed" });
  }
};

// Delete File
const deleteFile = async (req, res) => {
  const { id } = req.params; // This is the GridFS ID

  try {
    const gfsBucket = getGfsBucket();
    const objectId = new ObjectId(id);

    // 1. Delete from GridFS
    await gfsBucket.delete(objectId);

    // 2. Remove reference from Chapter
    // We search for any chapter containing this fileId and pull it
    await Chapter.updateMany(
      { "files.fileId": objectId },
      { $pull: { files: { fileId: objectId } } }
    );

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

module.exports = { uploadFile, getFiles, deleteFile };