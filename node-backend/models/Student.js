const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "student" },

  // Each enrollment links a student to a course and their chosen chapters
  enrolledCourses: [
    {
      course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
      selectedChapters: [
        {
          chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
          personalFiles: [
            {
              fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file _id
              filename: String,
              uploadedAt: { type: Date, default: Date.now },
            },
          ],
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
