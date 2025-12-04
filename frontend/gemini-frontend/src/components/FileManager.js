import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";

function FileManager({ student, course, chapter }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canUpload = Boolean(student && course);

  const loadFiles = () => {
    setLoading(true);
    setError("");
    apiRequest("/api/files")
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data);
        } else if (data && Array.isArray(data.files)) {
          setFiles(data.files);
        } else {
          setFiles([]);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async event => {
    event.preventDefault();
    if (!selectedFile || !canUpload) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const studentId = student._id || student.id;
      const courseId = course._id || course.id;
      if (studentId) {
        formData.append("studentId", studentId);
      }
      if (courseId) {
        formData.append("courseId", courseId);
      }
      if (chapter && (chapter._id || chapter.id)) {
        formData.append("chapterId", chapter._id || chapter.id);
      }
      const data = await apiRequest("/api/files/upload", {
        method: "POST",
        body: formData
      });
      const newFile = data.file || data;
      setFiles(prev => prev.concat(newFile));
      setSelectedFile(null);
      setSuccess("File uploaded and added to knowledge base");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/api/files/" + id, {
        method: "DELETE"
      });
      setFiles(prev => prev.filter(file => (file._id || file.id) !== id));
      setSuccess("File deleted");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Notes and files</h2>
      {!canUpload && (
        <div className="hint">Select a student and course before uploading notes</div>
      )}
      <form className="form form-inline" onSubmit={handleUpload}>
        <input
          type="file"
          className="input-file"
          onChange={event => {
            if (event.target.files && event.target.files[0]) {
              setSelectedFile(event.target.files[0]);
            } else {
              setSelectedFile(null);
            }
          }}
        />
        <button
          type="submit"
          className="button"
          disabled={!canUpload || !selectedFile || loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {files.length > 0 && (
        <div className="file-list">
          {files.map(file => {
            const id = file._id || file.id;
            return (
              <div key={id} className="file-item">
                <div className="file-main">
                  <div className="file-name">{file.filename || file.name || "File"}</div>
                  <div className="file-meta">
                    {file.mimetype || file.type || ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => handleDelete(id)}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      {loading && <div className="hint">Syncing files...</div>}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
}

export default FileManager;
