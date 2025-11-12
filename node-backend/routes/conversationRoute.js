const express = require("express");
const router = express.Router();
const { addMessage, getConversation } = require("../controllers/conversationController");

router.post("/:chapterId", addMessage);
router.get("/", getConversation);

module.exports = router;
