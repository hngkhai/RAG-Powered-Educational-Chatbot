const express = require("express");
const router = express.Router();
const {
  addChapter,
  getChaptersByStudentAndCourse,
} = require("../controllers/chapterController");

// Add a new chapter (requires studentId and courseId)
router.post("/add", addChapter);

// Get all chapters for a specific student and course
router.get("/:studentId/:courseId", getChaptersByStudentAndCourse);

module.exports = router;
