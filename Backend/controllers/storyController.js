const Story = require('../models/Stories')
const Theme = require("../models/Themes");


// POST route to create a new story
const saveStory = async (req, res) => {
    console.log(req.body);
    const { title, description, themeId, prompt } = req.body;
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
        const stories = await Story.find().sort({ timestamp: 1 }) // Retrieve all stories sorted by timestamp
        .populate("themeId", "title");  // Populate themeId with the theme name and description; 
        
        if (stories.length === 0) {
            return res.status(404).json({ message: "No stories found" });
        }
        res.status(200).json(stories);  // Return all stories as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

};

module.exports = { saveStory, getAllStories };