const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "GameSession", required: true },
    context: { type: String, required: true },
    userInput: { type: mongoose.Schema.Types.ObjectId, ref: "PlayerAction", required: false },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", logSchema);
