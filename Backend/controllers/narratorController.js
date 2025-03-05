require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI Narrator Function
const generateNarration = async (playerInput, previousChoices, storyPrompt) => {
	const prompt = `
        You are an AI Dungeon Master for a D&D game.
        Story setup: "${storyPrompt}"
        Player choices so far: [${previousChoices.join(", ")}]
        The player now says: "${playerInput}".
        Continue the story based on these choices.
    `;

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4",
			messages: [{ role: "system", content: "You are a fantasy narrator guiding players." }, { role: "user", content: prompt }],
			max_tokens: 250,
		});

		return response.choices[0].message.content;
	} catch (error) {
		console.error("OpenAI API error:", error);
		return "The narrator pauses, as if lost in thought...";
	}
};

// Start a New Game
const startGame = async (req, res) => {
	const { playerId, storyId } = req.body;
	if (!playerId || !storyId) return res.status(400).json({ message: "Missing player ID or story ID." });

	try {
		// TODO: take story from mongodb
		const story = {
			storyId: "67c7de2165039bfe161f5e2c",
			title: "Whispers in the Dark",
			description: "You find yourself lost within the haunted, labyrinthine paths of the Dark Forest. As you seek a way out, eerie whispers and shadowy figures guide (or mislead) your steps. Every decision could either save or doom you to wander forever.",
			themeId: "67c7cd9b4135be19acd72017",
			prompt: "A voice whispers your name from the darkness ahead, but you can't tell if it's a spirit, a trap, or a guide. The path forks, one leading deeper into the forest and the other back toward the edge of the woods. What do you do?",
		}
		if (!story) return res.status(404).json({ message: "Story not found." });

		let session = await GameSession.findOne({ playerId });

		if (!session) {
			session = new GameSession({
				playerId,
				storyId,
				storyState: `The adventure begins...\n${story.prompt}`,
				choices: [],
			});

			await session.save();
		}

		res.json({ message: `Game started: ${story.title}`, storyState: session.storyState });
	} catch (err) {
		console.log('err: ', err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

// Handle Player Choices and Generate AI Response
const playTurn = async (req, res) => {
	const { playerId, playerChoice } = req.body;
	if (!playerId || !playerChoice) return res.status(400).json({ message: "Missing player ID or choice." });

	try {
		let session = await GameSession.findOne({ playerId });

		if (!session) return res.status(404).json({ message: "Game session not found. Start a new game first." });

		// Generate AI response based on the player's input
		const updatedStory = await generateNarration(playerChoice, session.choices, session.storyState);

		session.choices.push(playerChoice);
		session.storyState = updatedStory;

		await session.save();

		res.json({ storyState: updatedStory, choices: session.choices });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

// Get Current Game State
const getGameState = async (req, res) => {
	const { playerId } = req.params;

	try {
		const session = await GameSession.findOne({ playerId });

		if (!session) return res.status(404).json({ message: "Game session not found." });

		res.json({
			storyState: session.storyState,
			choices: session.choices,
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

module.exports = { startGame, playTurn, getGameState };
