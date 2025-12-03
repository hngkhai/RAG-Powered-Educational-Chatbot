const Course = require("../models/Course");

// ------------------- Create New Course -------------------
exports.createCourse = async (req, res) => {
  try {
    const { title, course_code, studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const course = new Course({
      title,
      course_code,
      studentId,
    });

    await course.save();
    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ------------------- Get Course by ID -------------------
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate("chapters")
      .populate("studentId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json(course);
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Get Courses by Student ID -------------------
exports.getCoursesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const courses = await Course.find({ studentId })
      .populate("chapters")
      .populate("studentId", "name email");

    if (!courses || courses.length === 0)
      return res.status(404).json({ message: "No courses found for this student" });

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses by student ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
