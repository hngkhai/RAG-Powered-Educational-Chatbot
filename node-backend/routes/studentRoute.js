const express = require("express");
const router = express.Router();
const {
  registerStudent,
  enrollInCourse,
  addChapterToStudentCourse,
  removeChapterFromStudentCourse,
  uploadPersonalFile,
  getStudentProfile,
} = require("../controllers/studentController");

router.post("/register", registerStudent);
router.post("/enroll", enrollInCourse);
router.post("/add-chapter", addChapterToStudentCourse);
router.post("/remove-chapter", removeChapterFromStudentCourse);
router.post("/upload-note", uploadPersonalFile);
router.get("/:id", getStudentProfile);

module.exports = router;
