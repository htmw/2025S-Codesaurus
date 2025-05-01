const mongoose = require("mongoose");

const playerActionSchema = new mongoose.Schema({
	logId: { type: mongoose.Schema.Types.ObjectId, ref: "Log", required: true },
	moves: [
		{
			characterId: { type: mongoose.Schema.Types.ObjectId, ref: "Character", required: true },
			input: { type: String, required: true }
		}
	],
	timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PlayerAction", playerActionSchema);
