
const errorMiddleware = (err, req, res, next) => {

    console.error(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(error => error.message)
            .join(", ");
    }

    // Duplicate field error
    if (err.code === 11000) {
        statusCode = 409;
        message = "Duplicate value already exists";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;
