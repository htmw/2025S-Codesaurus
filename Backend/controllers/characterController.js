const Character = require("../models/Character");

const createCharacter = async (req, res) => {
    try {
        const { name, race, class: characterClass, background, stats } = req.body;

        // Validate input
        if (!name || !race || !characterClass || !background || !stats) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Save new character
        const newCharacter = new Character({ 
            name, 
            race, 
            class: characterClass, 
            background, 
            stats 
        });

        await newCharacter.save();

        res.status(201).json({ message: "Character created successfully", character: newCharacter });
    } catch (error) {
        console.error("Error creating character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCharacters = async (req, res) => {
    try {
        const characters = await Character.find().sort({ createdAt: -1 }); // Get latest first
        res.status(200).json(characters);
    } catch (error) {
        console.error("Error fetching characters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 🔥 New function to get characters by name
const getCharacterByName = async (req, res) => {
    try {
        const { name } = req.params;
        const character = await Character.findOne({ name });

        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        res.status(200).json(character);
    } catch (error) {
        console.error("Error fetching character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { createCharacter, getCharacters, getCharacterByName};