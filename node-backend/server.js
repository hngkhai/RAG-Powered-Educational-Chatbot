require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Import routes
const studentRoutes = require("./routes/studentRoute.js");
const courseRoutes = require("./routes/courseRoute.js");
const chapterRoutes = require("./routes/chapterRoute.js");
const fileRoutes = require("./routes/fileRoute.js");
const conversationRoutes = require("./routes/conversationRoute.js");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Main API routes
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/conversations", conversationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


