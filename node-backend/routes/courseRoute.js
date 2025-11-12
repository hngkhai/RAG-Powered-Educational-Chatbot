const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  getCoursesByStudentId,
} = require("../controllers/courseController");

router.post("/create", createCourse);
router.get("/student/:studentId", getCoursesByStudentId);
router.get("/:id", getCourseById); //optional

module.exports = router;
