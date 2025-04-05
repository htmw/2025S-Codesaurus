const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    race: { type: String, required: true },
    class: { type: String, required: true },
    background: { type: String, required: true },
    stats: {
        strength: { type: Number, required: true },
        dexterity: { type: Number, required: true },
        constitution: { type: Number, required: true },
        intelligence: { type: Number, required: true },
        wisdom: { type: Number, required: true },
        charisma: { type: Number, required: true }
    },
    gameSessionId: {  // ✅ Add this to allow linking to GameSession
        type: mongoose.Schema.Types.ObjectId,
        ref: "GameSession",
        required: false
    }, //TODO: try with just gameSessionId
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Character", characterSchema);
