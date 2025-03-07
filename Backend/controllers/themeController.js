const Theme = require("../models/Themes");

// POST route to create a new theme
const saveTheme = async (req, res) => {
    const { title, description } = req.body;  // Extract title and description from the request body
    // Ensure the title is provided
    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    try {
        const newTheme = new Theme({ 
                title, 
                description, 
            });  // Create a new Theme instance
        
            await newTheme.save();  // Save the theme to the database
        res.status(201).json({ message: "Theme saved successfully", theme: newTheme });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

// GET route to fetch all themes
const getAllThemes = async (req, res) => {
    try {
        const themes = await Theme.find().sort({ timestamp: 1 });  // Retrieve all themes sorted by timestamp
        if (themes.length === 0) {
            return res.status(404).json({ message: "No themes found" });
        }
        res.status(200).json(themes);  // Return all themes as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

};

// GET route to fetch all themes by themes ID
const getAllThemesbyId = async (req, res) => {
    try {
        const themes = await Theme.find().sort({ timestamp: 1 });  // Retrieve all themes sorted by timestamp
        if (themes.length === 0) {
            return res.status(404).json({ message: "No themes found" });
        }
        res.status(200).json(themes);  // Return all themes as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

};

module.exports = { saveTheme, getAllThemes, getAllThemesbyId };