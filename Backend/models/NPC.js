const mongoose = require("mongoose");

// This model represents the NPCs (Non-Player Characters) in multiple stories.

const npcSchema = new mongoose.Schema({
    title: { type: String, required: true }, // NPC's name
    role: { type: String, required: true }, // Role in the story (e.g., Villager, Merchant, Enemy, Guide)
    description: { type: String }, // Brief description of the NPC
    backstory: { type: String }, // Background information to add depth to the character
    stats: {
        strength: { type: Number, default: 2, min: 1, max: 10 },
        intelligence: { type: Number, default: 2, min: 1, max: 10 },
        charisma: { type: Number, default: 2, min: 1, max: 10 },
        agility: { type: Number, default: 2, min: 1, max: 10 }
    }, // Basic attributes to define NPC capabilities
    alignment: { type: String, enum: ["Good", "Neutral", "Evil"], default: "Neutral" }, // Moral alignment
    imageUrl: { type: String }, // URL to an image representing the NPC
    timestamp: { type: Date, default: Date.now } // Time - created_at
});

module.exports = mongoose.model("NPC", npcSchema);
