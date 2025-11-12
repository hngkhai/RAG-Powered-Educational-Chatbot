const File = require("../models/File");
const Chapter = require("../models/Chapter");
const multer = require("multer");
const { ObjectId } = require("mongodb");

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file (GridFS + metadata + File collection)
const uploadFile = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Check chapter validity
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });

    // Upload to GridFS
    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { studentId, courseId, chapterId },
    });

    uploadStream.end(file.buffer);

    uploadStream.on("finish", async (uploadedFile) => {
      // Save metadata reference in File collection
      const newFile = new File({
        filename: uploadedFile.filename,
        contentType: uploadedFile.contentType,
        size: uploadedFile.length,
        uploadDate: uploadedFile.uploadDate,
        studentId,
        courseId,
        chapterId,
      });

      await newFile.save();

      // Add to Chapter reference
      chapter.filesIds.push(newFile._id);
      await chapter.save();

      res.status(200).json({
        message: "File uploaded successfully",
        file: {
          id: newFile._id,
          gridfsId: uploadedFile._id,
          filename: newFile.filename,
        },
      });
    });

    uploadStream.on("error", (error) => {
      console.error("Error during file upload:", error);
      res.status(500).json({ error: "Internal server error during upload" });
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Files (by student, course, chapter)
const getFiles = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.query;
    const query = {};

    if (studentId) query["metadata.studentId"] = studentId;
    if (courseId) query["metadata.courseId"] = courseId;
    if (chapterId) query["metadata.chapterId"] = chapterId;

    const files = await gfsBucket.find(query).toArray();
    if (!files || files.length === 0)
      return res.status(404).json({ error: "No files found." });

    const formatted = files.map((f) => ({
      id: f._id,
      filename: f.filename,
      contentType: f.contentType,
      size: f.length,
      uploadDate: f.uploadDate,
      metadata: f.metadata,
    }));

    res.status(200).json({ files: formatted });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete File
const deleteFile = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid file ID format." });

  try {
    const _id = new ObjectId(id);

    const file = await gfsBucket.find({ _id }).toArray();
    if (file.length === 0)
      return res.status(404).json({ error: `File with ID "${id}" not found.` });

    await gfsBucket.delete(_id);

    const deletedFile = await File.findOneAndDelete({ filename: file[0].filename });
    if (deletedFile) {
      await Chapter.findByIdAndUpdate(deletedFile.chapterId, {
        $pull: { filesIds: deletedFile._id },
      });
    }

    res
      .status(200)
      .json({ message: `File with ID "${id}" deleted successfully.` });
  } catch (error) {
    console.error("Error deleting file:", error);
    if (error.message.includes("File not found for id"))
      return res.status(404).json({ error: `File with ID "${id}" not found.` });

    res
      .status(500)
      .json({ error: "Internal server error occurred while deleting the file." });
  }
};

// Export using CommonJS
module.exports = { uploadFile, getFiles, deleteFile };
