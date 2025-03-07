const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema({
	playerId: { type: String, required: true, unique: true }, //browser session id
	storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true },
	storyState: { type: String, required: true },
	isCompleted: { type: Boolean, default: false },
	endingState: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GameSession", gameSessionSchema);
