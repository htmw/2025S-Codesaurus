const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema({
    playerId: { type: String, required: true },  
    themeId: { type: mongoose.Schema.Types.ObjectId, ref: "Theme", required: true }, // Which theme is used
    createdAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model("GameSession", gameSessionSchema);
