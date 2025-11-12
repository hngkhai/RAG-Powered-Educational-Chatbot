const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
  messages: [
    {
      sender: { type: String, enum: ["student", "llm"], required: true },
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Conversation", conversationSchema);
