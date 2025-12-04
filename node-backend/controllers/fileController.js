const Chapter = require("../models/Chapter");
const { ObjectId } = require("mongodb");
const { getGfsBucket } = require("../utils/gridfs");

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
