import React, { useState } from "react";
import { apiRequest } from "../api";
import { nanoid } from "nanoid";

function ChatPanel({ chapter, student, course }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async event => {
    event.preventDefault();
    if (!chapter || !input.trim()) {
      return;
    }
    const text = input.trim();
    const userMessage = {
      id: nanoid(),
      role: "user",
      text
    };
    setMessages(prev => prev.concat(userMessage));
    setInput("");
    setLoading(true);
    setError("");
    try {
     //////////////Correction_CK////////////////// 
      const body = { 
          message: text, 
          studentId: student._id || student.id, // Ensure you are sending these!
          sender: "student"       // Ensure you are sending these!
      };
      const data = await apiRequest("/api/conversations/" + (chapter._id || chapter.id), {
        method: "POST",
        body
      });
      const answerText =
        (data && (data.answer || data.response || data.text || data.message)) ||
        JSON.stringify(data, null, 2);
      const context =
        (data && (data.context || data.retrievedChunks || data.chunks)) || null;
      const assistantMessage = {
        id: nanoid(),
        role: "assistant",
        text: answerText,
        context
      };
      setMessages(prev => prev.concat(assistantMessage));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !chapter;

  const headerCourse = course && (course.code || course.name || "");
  const headerChapter = chapter && (chapter.title || "");

  return (
    <div className="chat-root">
      <div className="chat-header">
        <div>
          <div className="chat-title">Chat with your notes</div>
          {disabled && (
            <div className="chat-subtitle">
              Select a course and chapter on the left to start chatting
            </div>
          )}
          {!disabled && (
            <div className="chat-subtitle">
              {headerCourse && headerCourse + " · "}
              {headerChapter || "Unnamed chapter"}
            </div>
          )}
        </div>
        {student && (
          <div className="chat-student">
            {(student.name || "Student") +
              " (" +
              (student._id || student.id || "no id") +
              ")"}
          </div>
        )}
      </div>
      <div className="chat-body">
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask something like
            <span className="chat-example">
              Explain the transformer architecture using my lecture notes
            </span>
            or
            <span className="chat-example">
              Generate 3 quiz questions on multi-head attention
            </span>
          </div>
        )}
        {messages.map(message => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={
                "chat-message " + (isUser ? "chat-message-user" : "chat-message-assistant")
              }
            >
              <div className="chat-message-role">
                {isUser ? "You" : "Gemini study assistant"}
              </div>
              <div className="chat-message-text">
                {message.text}
              </div>
              {!isUser && message.context && (
                <div className="chat-context">
                  <div className="chat-context-title">Retrieved context</div>
                  {Array.isArray(message.context) ? (
                    message.context.map((c, index) => (
                      <div key={index} className="chat-context-item">
                        <div className="chat-context-source">
                          {c.source || c.filename || c.id || "Chunk " + (index + 1)}
                        </div>
                        <div className="chat-context-text">
                          {c.text || c.content || JSON.stringify(c)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="chat-context-item">
                      <div className="chat-context-text">
                        {typeof message.context === "string"
                          ? message.context
                          : JSON.stringify(message.context)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          className="input chat-input"
          placeholder={
            disabled
              ? "Select a chapter on the left first"
              : "Ask a question about your CSC4100 notes..."
          }
          value={input}
          onChange={event => setInput(event.target.value)}
          disabled={disabled || loading}
        />
        <button
          type="submit"
          className="button button-primary"
          disabled={disabled || loading || !input.trim()}
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
      {error && <div className="error chat-error">{error}</div>}
    </div>
  );
}

export default ChatPanel;
