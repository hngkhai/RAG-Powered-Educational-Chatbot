import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";

function CourseManager({ student, selectedCourse, onCourseChange }) {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) {
      setCourses([]);
      return;
    }
    const id = student._id || student.id;
    if (!id) {
      setCourses([]);
      return;
    }
    setLoading(true);
    setError("");
    apiRequest("/api/courses/student/" + id)
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else if (data && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [student]);

  const handleCreate = async event => {
    event.preventDefault();
    if (!student) {
      return;
    }
    if (!name.trim()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        code: code.trim(),
        studentId: student._id || student.id
      };
      const data = await apiRequest("/api/courses/create", {
        method: "POST",
        body
      });
      const newCourse = data.course || data;
      setCourses(prev => prev.concat(newCourse));
      onCourseChange(newCourse);
      setName("");
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeId = selectedCourse && (selectedCourse._id || selectedCourse.id);

  return (
    <div className="panel">
      <h2 className="panel-title">Courses</h2>
      {!student && (
        <div className="hint">Register or load a student to see courses</div>
      )}
      {student && (
        <>
          <div className="pill-row">
            {courses.map(course => {
              const id = course._id || course.id;
              const isActive = activeId && activeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={"pill" + (isActive ? " pill-active" : "")}
                  onClick={() => onCourseChange(course)}
                >
                  {(course.code || "Course") + " · " + (course.name || "Untitled")}
                </button>
              );
            })}
            {courses.length === 0 && !loading && (
              <div className="hint">No courses yet, create one below</div>
            )}
          </div>
          <form className="form form-inline" onSubmit={handleCreate}>
            <input
              type="text"
              className="input"
              placeholder="Course name (e.g. CSC4100)"
              value={name}
              onChange={event => setName(event.target.value)}
            />
            <input
              type="text"
              className="input"
              placeholder="Short code (optional)"
              value={code}
              onChange={event => setCode(event.target.value)}
            />
            <button
              type="submit"
              className="button"
              disabled={loading}
            >
              Add
            </button>
          </form>
        </>
      )}
      {loading && <div className="hint">Loading courses...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default CourseManager;
