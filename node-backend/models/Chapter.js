const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  studentId : { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true},
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  filesIds: [{ type: mongoose.Schema.Types.ObjectId }],
  conversationsIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }],
});

module.exports = mongoose.model("Chapter", chapterSchema);

