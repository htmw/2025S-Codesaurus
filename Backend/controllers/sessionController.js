const GameSession = require("../models/GameSession");

const startSession = async (req, res) => {
        const { playerId, themeId } = req.body;

        const newSession = new GameSession({
            playerId,
            themeId,
        });

        await newSession.save();
        res.status(201).json({ message: "Game session started", sessionId: newSession._id });
};

module.exports = { startSession };