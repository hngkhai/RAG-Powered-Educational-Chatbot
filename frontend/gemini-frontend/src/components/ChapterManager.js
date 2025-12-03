import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";

function ChapterManager({ student, course, selectedChapter, onChapterChange }) {
  const [chapters, setChapters] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student || !course) {
      setChapters([]);
      return;
    }
    const studentId = student._id || student.id;
    const courseId = course._id || course.id;
    if (!studentId || !courseId) {
      setChapters([]);
      return;
    }
    setLoading(true);
    setError("");
    apiRequest("/api/chapters/" + studentId + "/" + courseId)
      .then(data => {
        if (Array.isArray(data)) {
          setChapters(data);
        } else if (data && Array.isArray(data.chapters)) {
          setChapters(data.chapters);
        } else {
          setChapters([]);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [student, course]);

  const handleCreate = async event => {
    event.preventDefault();
    if (!student || !course) {
      return;
    }
    if (!title.trim()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        title: title.trim(),
        description: desc.trim(),
        studentId: student._id || student.id,
        courseId: course._id || course.id
      };
      const data = await apiRequest("/api/chapters/add", {
        method: "POST",
        body
      });
      const newChapter = data.chapter || data;
      setChapters(prev => prev.concat(newChapter));
      onChapterChange(newChapter);
      setTitle("");
      setDesc("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeId = selectedChapter && (selectedChapter._id || selectedChapter.id);

  return (
    <div className="panel">
      <h2 className="panel-title">Chapters</h2>
      {!course && (
        <div className="hint">Select a course to see its chapters</div>
      )}
      {course && (
        <>
          <div className="pill-row">
            {chapters.map(chapter => {
              const id = chapter._id || chapter.id;
              const isActive = activeId && activeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={"pill" + (isActive ? " pill-active" : "")}
                  onClick={() => onChapterChange(chapter)}
                >
                  {chapter.title || "Untitled chapter"}
                </button>
              );
            })}
            {chapters.length === 0 && !loading && (
              <div className="hint">No chapters yet, add one below</div>
            )}
          </div>
          <form className="form" onSubmit={handleCreate}>
            <input
              type="text"
              className="input"
              placeholder="Chapter title (e.g. Transformer attention)"
              value={title}
              onChange={event => setTitle(event.target.value)}
            />
            <input
              type="text"
              className="input"
              placeholder="Short description (optional)"
              value={desc}
              onChange={event => setDesc(event.target.value)}
            />
            <button
              type="submit"
              className="button"
              disabled={loading}
            >
              Add chapter
            </button>
          </form>
        </>
      )}
      {loading && <div className="hint">Loading chapters...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default ChapterManager;
