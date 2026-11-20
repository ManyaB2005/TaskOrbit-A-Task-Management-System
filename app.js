const express = require("express");
const app = express();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");


app.use(express.json());

app.get("/", (req, res) => {
    res.send("Task Management API is running!");
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;