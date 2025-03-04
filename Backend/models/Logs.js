const mongoose = require("mongoose");

// Defining the structure to hold the incoming context and user interaction
// Maybe use time to maintain order for LLM? Uses very little addtioinal tokens, not too much

const logSchema = new mongoose.Schema({
    context: { type: String, required: true },   // AI Context
    userInput: { type: String, required: true }, // User interaction
    timestamp: { type: Date, default: Date.now } // Time - maybe?
});

module.exports = mongoose.model("Log", logSchema);
