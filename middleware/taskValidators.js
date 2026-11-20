
const { body } = require("express-validator");

// Validation for creating a task
const createTaskValidator = [
    body("title")
        .exists().withMessage("Task title is required")
        .bail()
        .isString().withMessage("Title must be a string")
        .bail()
        .trim()
        .notEmpty().withMessage("Task title cannot be empty"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("priority")
        .optional()
        .isIn(["Low", "Medium", "High"])
        .withMessage("Invalid priority"),

    body("completed")
        .optional()
        .isBoolean()
        .withMessage("Completed must be true or false")
];

// Validation for updating a task
const updateTaskValidator = [
    body("title")
        .optional()
        .isString().withMessage("Title must be a string")
        .bail()
        .trim()
        .notEmpty().withMessage("Title cannot be empty"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("priority")
        .optional()
        .isIn(["Low", "Medium", "High"])
        .withMessage("Invalid priority"),

    body("completed")
        .optional()
        .isBoolean()
        .withMessage("Completed must be true or false")
];

module.exports = {
    createTaskValidator,
    updateTaskValidator
};
