const mongoose = require("mongoose");

// Defining the structure to hold the incoming context and user interaction
// Maybe use time to maintain order for LLM? Uses very little addtioinal tokens, not too much

const logSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "GameSession", required: true }, // Links to a game session
    context: { type: String, required: true },   // AI's story state before the user input
    userInput: { type: String, required: true }, // Player's response
    timestamp: { type: Date, default: Date.now } // Time - used for ordering
});

module.exports = mongoose.model("Log", logSchema);
