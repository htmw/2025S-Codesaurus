const mongoose = require("mongoose");
const Character = require("../models/Character");

const createCharacterInDB = async ({ name, race, characterClass, background, stats, gameSessionId }) => {
    if (!name || !race || !characterClass || !background || !stats) {
        throw new Error("All fields are required");
    }

    const sessionObjectId =
        gameSessionId && mongoose.Types.ObjectId.isValid(gameSessionId)
            ? new mongoose.Types.ObjectId(gameSessionId)
            : null;

    if (gameSessionId && !sessionObjectId) {
        throw new Error("Invalid gameSessionId format");
    }

    const newCharacter = new Character({
        name,
        race,
        class: characterClass,
        background,
        stats,
        gameSessionId: sessionObjectId,
    });

    await newCharacter.save();
    return newCharacter;
};

const createCharacter = async (req, res) => {
    try {
        const { name, race, class: characterClass, background, stats, gameSessionId } = req.body;

        const newCharacter = await createCharacterInDB({
            name,
            race,
            characterClass,
            background,
            stats,
            gameSessionId,
        });

        res.status(201).json({ message: "Character created successfully", character: newCharacter });
    } catch (error) {
        console.error("Error creating character:", error);
        res.status(400).json({ message: error.message || "Internal server error" });
    }
};


const getCharacters = async (req, res) => {
    try {
        let { gameSessionId } = req.query; // Accept gameSessionId as a query param

        let query = {};
        if (gameSessionId) {
            if (!mongoose.Types.ObjectId.isValid(gameSessionId)) {
                return res.status(400).json({ message: "Invalid gameSessionId format" });
            }
            query.gameSessionId = new mongoose.Types.ObjectId(gameSessionId);
        }

        const characters = await Character.find(query).sort({ createdAt: -1 });

        res.status(200).json(characters);
    } catch (error) {
        console.error("Error fetching characters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getCharacterByName = async (req, res) => {
    try {
        const { name } = req.params;
        let { gameSessionId } = req.query; // Optional session filter

        let query = { name: name };
        if (gameSessionId) {
            if (!mongoose.Types.ObjectId.isValid(gameSessionId)) {
                return res.status(400).json({ message: "Invalid gameSessionId format" });
            }
            query.gameSessionId = new mongoose.Types.ObjectId(gameSessionId);
        }

        const character = await Character.findOne(query);

        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        res.status(200).json(character);
    } catch (error) {
        console.error("Error fetching character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = {
    createCharacter,
    getCharacters,
    getCharacterByName,
    createCharacterInDB
};
