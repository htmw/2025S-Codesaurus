const mongoose = require("mongoose");

// Each theme represents a specific category of stories. Themes are unique
// And the theme will hold the context for the AI

const themeSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },  // e.g., "Cyberpunk"
    description: { type: String },  // Optional description of the theme
    timestamp: { type: Date, default: Date.now } // Time - created_at
});

module.exports = mongoose.model("Theme", themeSchema);
