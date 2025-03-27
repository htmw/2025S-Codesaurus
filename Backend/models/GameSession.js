const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema({
	storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true },
	storyState: { type: String, required: true },
	isCompleted: { type: Boolean, default: false },
	endingState: { type: String, default: null },
	requiresRoll: { type: Boolean, default: false },
	rollThreshold: { type: Number, default: null },
	createdAt: { type: Date, default: Date.now },
	npcStates: [{
		npcId: { type: mongoose.Schema.Types.ObjectId, ref: "NPC" },
		isActive: { type: Boolean, default: false }
	  }]	  
});

module.exports = mongoose.model("GameSession", gameSessionSchema);
