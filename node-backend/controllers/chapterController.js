const Chapter = require("../models/Chapter");
const Course = require("../models/Course");

// ------------------- Add a New Chapter -------------------
exports.addChapter = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;
    const { title } = req.body;

    // ✅ Validate required fields
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    // ✅ Check if course exists and belongs to this student
    const course = await Course.findOne({ _id: courseId, studentId });
    if (!course) return res.status(404).json({ message: "Course not found for this student" });

    // ✅ Create new chapter linked to both student and course
    const newChapter = new Chapter({
      title,
      studentId,
      courseId,
    });

    await newChapter.save();

    // ✅ Push chapter reference into course
    course.chapters.push(newChapter._id);
    await course.save();

    res.status(201).json({
      message: "Chapter added successfully",
      chapter: newChapter,
    });
  } catch (error) {
    console.error("Error adding chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Get Chapters by Student + Course -------------------
exports.getChaptersByStudentAndCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    const chapters = await Chapter.find({ studentId, courseId })
      .populate("filesIds")
      .populate("conversationsIds");

    if (!chapters || chapters.length === 0) {
      return res.status(404).json({ message: "No chapters found for this student and course" });
    }

    res.status(200).json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};