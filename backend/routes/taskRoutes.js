const express = require("express");
const router = express.Router();

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");
const {
    createTaskValidator,
    updateTaskValidator
} = require("../middleware/taskValidators");

const validateRequest = require("../middleware/validateRequest");

// Create Task
router.post(
    "/",
    authMiddleware,
    createTaskValidator,
    validateRequest,
    createTask
);

// Get All Tasks
router.get("/", authMiddleware, getTasks);

// Get Single Task
router.get("/:id", authMiddleware, getTaskById);

// Update Task
router.patch(
    "/:id",
    authMiddleware,
    updateTaskValidator,
    validateRequest,
    updateTask
);

// Delete Task
router.delete("/:id", authMiddleware, deleteTask);

module.exports = router;