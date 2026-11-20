const express = require("express");
const cors = require("cors");

const app = express();

// Import routes and middleware
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const aiRoutes = require("./routes/aiRoutes");

// Middleware
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Task Management API is running!");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// Error handling middleware (keep this last)
app.use(errorMiddleware);

module.exports = app;