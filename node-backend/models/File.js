const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: { type: String, required: false },
  contentType: { type: String, required: false },
  size: { type: Number, required: false },
  uploadDate: { type: Date, default: Date.now,  required: false  },
  metadata: { type: Object, required: false  },

  // Relationships
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
});

module.exports = mongoose.model("File", fileSchema);
