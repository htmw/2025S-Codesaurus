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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Character", characterSchema); // Stored in model name Character 
