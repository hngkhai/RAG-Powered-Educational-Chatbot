const Student = require("../models/Student");
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const { getGfsBucket } = require("../utils/gridfs");
const multer = require("multer");
const { ObjectId } = require("mongodb");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------- Register Student -------------------
exports.registerStudent = async (req, res) => {
  try {
    const { name, email } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const student = new Student({ name, email});
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Enroll in a Course -------------------
exports.enrollInCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);
    if (!student || !course) return res.status(404).json({ message: "Student or Course not found" });

    const alreadyEnrolled = student.enrolledCourses.some(
      (enroll) => enroll.course.toString() === courseId
    );
    if (alreadyEnrolled) return res.status(400).json({ message: "Already enrolled in this course" });

    student.enrolledCourses.push({ course: courseId, selectedChapters: [] });
    await student.save();
    res.status(200).json({ message: "Enrolled successfully", student });
  } catch (error) {
    console.error("Error enrolling:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Add Chapter -------------------
exports.addChapterToStudentCourse = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const courseEnrollment = student.enrolledCourses.find(
      (c) => c.course.toString() === courseId
    );
    if (!courseEnrollment)
      return res.status(400).json({ message: "Student not enrolled in this course" });

    const alreadyAdded = courseEnrollment.selectedChapters.some(
      (ch) => ch.chapter.toString() === chapterId
    );
    if (alreadyAdded)
      return res.status(400).json({ message: "Chapter already added" });

    courseEnrollment.selectedChapters.push({ chapter: chapterId });
    await student.save();

    res.status(200).json({ message: "Chapter added successfully", student });
  } catch (error) {
    console.error("Error adding chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Remove Chapter -------------------
exports.removeChapterFromStudentCourse = async (req, res) => {
  try {
    const { studentId, courseId, chapterId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const courseEnrollment = student.enrolledCourses.find(
      (c) => c.course.toString() === courseId
    );
    if (!courseEnrollment)
      return res.status(400).json({ message: "Student not enrolled in this course" });

    courseEnrollment.selectedChapters = courseEnrollment.selectedChapters.filter(
      (ch) => ch.chapter.toString() !== chapterId
    );
    await student.save();

    res.status(200).json({ message: "Chapter removed successfully", student });
  } catch (error) {
    console.error("Error removing chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Upload Personal File -------------------
exports.uploadPersonalFile = [
  upload.single("file"),
  async (req, res) => {
    try {
      const { studentId, courseId, chapterId } = req.body;
      const file = req.file;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });

      const gfsBucket = getGfsBucket();
      const uploadStream = gfsBucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: { studentId, courseId, chapterId },
      });

      uploadStream.end(file.buffer);
      uploadStream.on("finish", async (uploadedFile) => {
        const courseEnrollment = student.enrolledCourses.find(
          (c) => c.course.toString() === courseId
        );
        if (!courseEnrollment)
          return res.status(400).json({ message: "Student not enrolled in this course" });

        const chapterRecord = courseEnrollment.selectedChapters.find(
          (c) => c.chapter.toString() === chapterId
        );
        if (!chapterRecord)
          return res.status(400).json({ message: "Chapter not added yet" });

        chapterRecord.personalFiles.push({
          fileId: uploadedFile._id,
          filename: uploadedFile.filename,
        });

        await student.save();
        res.status(200).json({
          message: "File uploaded successfully",
          file: uploadedFile,
          student,
        });
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

// ------------------- Get Student Profile -------------------
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .populate({
        path: "enrolledCourses.course",
        select: "title description",
      })
      .populate({
        path: "enrolledCourses.selectedChapters.chapter",
        select: "title",
      });

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
