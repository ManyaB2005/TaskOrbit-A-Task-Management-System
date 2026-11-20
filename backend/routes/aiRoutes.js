
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    breakdownTasks,
    chatWithAI
} = require("../controllers/aiController");

// AI Task Breakdown endpoint
router.post("/breakdown", authMiddleware, breakdownTasks);

// AI Task Management Chatbot endpoint
router.post("/chat", authMiddleware, chatWithAI);

module.exports = router;
