const Conversation = require("../models/Conversation");
const Chapter = require("../models/Chapter");

// Add a new message to a conversation (or create one if it doesn’t exist)
exports.addMessage = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { studentId, sender, text } = req.body;

    let conversation = await Conversation.findOne({ student: studentId, chapter: chapterId });
    if (!conversation) {
      conversation = new Conversation({ student: studentId, chapter: chapterId, messages: [] });
    }

    conversation.messages.push({ sender, text });
    await conversation.save();

    const chapter = await Chapter.findById(chapterId);
    if (!chapter.conversations.includes(conversation._id)) {
      chapter.conversations.push(conversation._id);
      await chapter.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error saving message:", error);
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
    res.status(500).json({ message: "Internal server error" });
  }
};
