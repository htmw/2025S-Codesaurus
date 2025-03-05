const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema({
	playerId: { type: String, required: true, unique: true }, // Unique player identifier
	storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true }, // Link to story
	storyState: { type: String, required: true }, // Current story progress
	choices: [{ type: String }], // Player's previous choices
	createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model("GameSession", gameSessionSchema);
