const mongoose = require("mongoose");

// This model represents the stories available for selection.
// Story holds predefined story content, with a reference to Theme.

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },  // Title of the story
    description: { type: String },  // Brief description displayed for the preset
    themeId: { type: mongoose.Schema.Types.ObjectId, ref: "Theme", required: true },  // References the theme
    prompt: { type: String, required: true },  // Starting prompt for the AI
    narrator_tone: { type: String },  // Optional tone of the theme used for narration
    duration: { type: Number, required: true, min: 5 }, // Approximate duration in minutes until the Story ends
    npcIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "NPC" }], // Links multiple NPCs to the story
    timestamp: { type: Date, default: Date.now }, // Time - created_at
    requirements: { type: Array, default: [] }
});

module.exports = mongoose.model("Story", storySchema);
