
const Task = require("../models/Task");

// Create Task
const createTask = async (req, res, next) => {
    try {
        const { title, description, priority } = req.body;

        // Validate title
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        // Create task
        const task = await Task.create({
            title: title.trim(),
            description,
            priority,
            user: req.user.userId
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });

    } catch (error) {
        next(error);
    }
};

// Get All Tasks

const getTasks = async (req, res, next) => {
    try {
        const { search, completed, priority } = req.query;

        // Filter only the logged-in user's tasks
        const filter = {
            user: req.user.userId
        };

        // Search tasks by title
        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            };
        }

        // Filter by completion status
        if (completed !== undefined) {
            if (completed === "true") {
                filter.completed = true;
            } else if (completed === "false") {
                filter.completed = false;
            } else {
                return res.status(400).json({
                    message: "Invalid completed value"
                });
            }
        }

        // Filter by priority
        if (priority) {
            if (!["Low", "Medium", "High"].includes(priority)) {
                return res.status(400).json({
                    message: "Invalid priority"
                });
            }

            filter.priority = priority;
        }

        // Fetch filtered tasks
        const tasks = await Task.find(filter)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Tasks fetched successfully",
            count: tasks.length,
            tasks
        });

    } catch (error) {
        next(error);
    }
};


// Get Single Task
const getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task fetched successfully",
            task
        });

    } catch (error) {
        next(error);
    }
};

// Update Task
const updateTask = async (req, res, next) => {
    try {
        const { title, description, completed, priority } = req.body;

        const updates = {};

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Task title cannot be empty"
                });
            }
            updates.title = title.trim();
        }

        if (description !== undefined) updates.description = description;
        if (completed !== undefined) updates.completed = completed;
        if (priority !== undefined) updates.priority = priority;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Provide at least one field to update"
            });
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.userId
            },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        next(error);
    }
};

// Delete Task
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { createTask , getTasks , getTaskById , updateTask , deleteTask };
