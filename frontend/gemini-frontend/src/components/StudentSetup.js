import React, { useState } from "react";
import { apiRequest } from "../api";

function StudentSetup({ student, onStudentChange }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [existingId, setExistingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async event => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      const body = { name: name.trim() };
      if (email.trim()) {
        body.email = email.trim();
      }
      const data = await apiRequest("/api/students/register", {
        method: "POST",
        body
      });
      onStudentChange(data);
      setSuccess("Student registered");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = async event => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!existingId.trim()) {
      setError("Student ID is required");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/api/students/" + existingId.trim(), {
        method: "GET"
      });
      onStudentChange(data);
      setSuccess("Loaded existing student");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeId = student && (student._id || student.id);

  return (
    <div className="panel">
      <h2 className="panel-title">Student</h2>
      {activeId && (
        <div className="badge">
          Active student: {student.name || "Unnamed"} ({activeId})
        </div>
      )}
      <div className="panel-section">
        <h3 className="panel-subtitle">Register new</h3>
        <form className="form" onSubmit={handleRegister}>
          <input
            type="text"
            className="input"
            placeholder="Name"
            value={name}
            onChange={event => setName(event.target.value)}
          />
          <input
            type="email"
            className="input"
            placeholder="Email (optional)"
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Register"}
          </button>
        </form>
      </div>
      <div className="panel-section">
        <h3 className="panel-subtitle">Use existing by ID</h3>
        <form className="form form-inline" onSubmit={handleUseExisting}>
          <input
            type="text"
            className="input"
            placeholder="Student ID from DB"
            value={existingId}
            onChange={event => setExistingId(event.target.value)}
          />
          <button
            type="submit"
            className="button"
            disabled={loading}
          >
            Load
          </button>
        </form>
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
}

export default StudentSetup;
