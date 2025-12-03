import React, { useState } from "react";
import StudentSetup from "./components/StudentSetup";
import CourseManager from "./components/CourseManager";
import ChapterManager from "./components/ChapterManager";
import FileManager from "./components/FileManager";
import ChatPanel from "./components/ChatPanel";

function App() {
  const [student, setStudent] = useState(null);
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);

  const handleStudentChange = value => {
    setStudent(value);
    setCourse(null);
    setChapter(null);
  };

  const handleCourseChange = value => {
    setCourse(value);
    setChapter(null);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">G</div>
          <div className="logo-text">
            <div className="logo-title">Gemini Study Assistant</div>
            <div className="logo-subtitle">CSC4100 RAG chatbot</div>
          </div>
        </div>
        <StudentSetup student={student} onStudentChange={handleStudentChange} />
        <CourseManager
          student={student}
          selectedCourse={course}
          onCourseChange={handleCourseChange}
        />
        <ChapterManager
          student={student}
          course={course}
          selectedChapter={chapter}
          onChapterChange={setChapter}
        />
        <FileManager student={student} course={course} chapter={chapter} />
      </aside>
      <main className="main">
        <ChatPanel chapter={chapter} student={student} course={course} />
      </main>
    </div>
  );
}

export default App;
