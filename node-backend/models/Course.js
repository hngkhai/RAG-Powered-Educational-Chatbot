const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course_code: {type: String, required:false},
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter"}],
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
});

module.exports = mongoose.model("Course", courseSchema);
