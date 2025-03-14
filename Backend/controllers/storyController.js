const Story = require('../models/Stories')
const Theme = require("../models/Themes");


// POST route to create a new story
const saveStory = async (req, res) => {
    const { title, description, themeId, prompt, narrator_tone, duration } = req.body;
    // Ensure the title is provided
    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }
    if (!themeId) {
        return res.status(400).json({ message: "themeId is required" });
    }
    if (!prompt) {
        return res.status(400).json({ message: "prompt is required" });
    }

    try {
        // Check if the themeId is valid
        const theme = await Theme.findById(themeId);
        if (!theme) {
            return res.status(400).json({ message: "Invalid themeId" });
        }

        const newStory = new Story({
            title,
            description,
            themeId,
            prompt,
            narrator_tone,
            duration,
        });

        await newStory.save();  // Save the Story to the database
        res.status(201).json({ message: "Story saved successfully", story: newStory });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

// GET route to fetch all stories
const getAllStories = async (req, res) => {
    try {
        const stories = await Story.find().sort({ timestamp: -1 }) // Retrieve all stories sorted by most recent timestamp
        .populate("themeId", "title");  // Populate themeId with the themeId name and title; 
        
        if (stories.length === 0) {
            return res.status(404).json({ message: "No stories found" });
        }
        res.status(200).json(stories);  // Return all stories as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

};

// GET route to fetch all stories
const getStoryById = async (req, res) => {
    const { id } = req.params; // Extract story ID from URL parameters

    try {
        // Find the story by its ID
        const story = await Story.findById(id).populate("themeId", "title");

        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        res.status(200).json(story);  // Return the found story as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }

};


module.exports = { saveStory, getAllStories, getStoryById };