
const mongoose = require("mongoose");

// Define User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    }
});

// Create User Model
const User = mongoose.model("User", userSchema);

module.exports = User;
