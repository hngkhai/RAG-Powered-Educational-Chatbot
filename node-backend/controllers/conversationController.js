const Conversation = require("../models/Conversation");
const Chapter = require("../models/Chapter");

// Add a new message to a conversation
exports.addMessage = async (req, res) => {
  try {
    const { chapterId } = req.params;
    
    // 1. Handle Input (React sends 'message', we treat it as 'text')
    const { studentId, sender, message } = req.body;
    const text = message || req.body.text; 

    if (!studentId || !text) {
        return res.status(400).json({ message: "Missing studentId or text" });
    }

    // 2. Save User Message to DB
    let conversation = await Conversation.findOne({ student: studentId, chapter: chapterId });
    if (!conversation) {
      conversation = new Conversation({ student: studentId, chapter: chapterId, messages: [] });
    }

    conversation.messages.push({ sender: "student", text });
    await conversation.save();

    // 3. Link Conversation to Chapter (Defensive Coding Added Here)
    const chapter = await Chapter.findById(chapterId);
    
    if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
    }

    // Safety check: Initialize array if it's missing in the database
    if (!chapter.conversationsIds) {
        chapter.conversationsIds = [];
    }

    if (!chapter.conversationsIds.includes(conversation._id)) {
      chapter.conversationsIds.push(conversation._id);
      await chapter.save();
    }

    // // 4. Find the GridFS File ID to chat with (MVP: Pick the first file in the chapter)
    const fileId = (chapter.filesIds && chapter.filesIds.length > 0) 
        ? chapter.filesIds[0].toString() 
        : null;
    // ================================

    if (!fileId) {
        return res.status(200).json({ 
            answer: "No file found in this chapter. Please upload a PDF notes file first so I can read it!",
            conversation
        });
    }

    // 5. Call Python Backend (The Bridge)
    let aiResponseText = "I encountered an error processing your request.";

    try {
        // Ensure your Python server is running on port 8000
        const pythonResponse = await fetch("http://localhost:8000/generate-quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: text, // Map 'text' -> 'question' for Python
                fileId: fileId
            })
        });

        if (!pythonResponse.ok) {
            console.error(`Python API Status: ${pythonResponse.status}`);
            throw new Error("Python API unreachable or error");
        }

        const data = await pythonResponse.json();
        
        // Handle different response formats from Python
        if (typeof data === 'string') {
            aiResponseText = data;
        } else if (data.answer) {
            aiResponseText = data.answer;
        } else {
            aiResponseText = JSON.stringify(data);
        }

    } catch (pythonError) {
        console.error("Python Bridge Error:", pythonError.message);
        aiResponseText = "Sorry, I couldn't reach the AI brain. Please ensure the Python backend is running.";
    }

    // 6. Save AI Response to DB
    conversation.messages.push({ 
        sender: "llm", 
        text: aiResponseText 
    });
    await conversation.save();

    // 7. Return formatted response to React
    res.status(200).json({
        answer: aiResponseText,
        conversation: conversation
    });

  } catch (error) {
    console.error("Error in addMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get conversation for a chapter and student
exports.getConversation = async (req, res) => {
  try {
    const { chapterId, studentId } = req.query;
    const conversation = await Conversation.findOne({ chapter: chapterId, student: studentId });
    res.json(conversation || { messages: [] });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};