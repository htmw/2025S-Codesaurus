require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Narrator Function - Generates AI narration based on past choices
 */
const generateNarration = async (playerInput, sessionId, storyPrompt) => {
	try {
		// Fetch previous choices from logs
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const previousChoices = logs.map(log => log.userInput);

		const prompt = `
            You are an AI Dungeon Master for a D&D game.
            Story setup: "${storyPrompt}"
            Player choices so far: [${previousChoices.join(", ")}]
            The player now says: "${playerInput}".
            Continue the story based on these choices.
        `;

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

/**
 * Start a New Game Session
 */
const startGame = async (req, res) => {
	const { storyId } = req.body;  // Frontend now only sends storyId
	if (!storyId) return res.status(400).json({ message: "Missing story ID." });

	try {
		// Fetch story from database
		// const story = await Story.findById(storyId);
		const story = {
			storyId: "67c7de2165039bfe161f5e2c",
			title: "Whispers in the Dark",
			description: "You find yourself lost within the haunted, labyrinthine paths of the Dark Forest. As you seek a way out, eerie whispers and shadowy figures guide (or mislead) your steps. Every decision could either save or doom you to wander forever.",
			themeId: "67c7cd9b4135be19acd72017",
			prompt: "A voice whispers your name from the darkness ahead, but you can't tell if it's a spirit, a trap, or a guide. The path forks, one leading deeper into the forest and the other back toward the edge of the woods. What do you do?",
		}
		if (!story) return res.status(404).json({ message: "Story not found." });

		// Create a new game session (MongoDB will generate the _id automatically)
		const session = new GameSession({
			storyId,
			storyState: `The adventure begins...\n${story.prompt}`,
		});

		await session.save(); // MongoDB generates the _id when saving

		res.json({
			message: `Game started: ${story.title}`,
			sessionId: session._id.toString(), // Send MongoDB-generated ID to frontend
			storyState: session.storyState,
		});
	} catch (err) {
		console.error("Server Error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

/**
 * Handle Player Turn & Generate AI Response
 */
const playTurn = async (req, res) => {
	const { sessionId, playerChoice } = req.body;
	if (!sessionId || !playerChoice) return res.status(400).json({ message: "Missing session ID or player choice." });

	try {
		let session = await GameSession.findById(sessionId);

		if (!session) return res.status(404).json({ message: "Game session not found. Start a new game first." });

		if (session.isCompleted) {
			return res.json({ message: "Game has already ended.", endingState: session.endingState });
		}

		// Save user input to Logs
		await Log.create({
			sessionId,
			context: session.storyState,
			userInput: playerChoice,
		});

		// Generate AI response based on previous choices
		const updatedStory = await generateNarration(playerChoice, sessionId, session.storyState);

		session.storyState = updatedStory;

		// Check for End Game Triggers (e.g., max turns, specific keywords)
		const logCount = await Log.countDocuments({ sessionId });
		if (playerChoice.toLowerCase().includes("escape") || logCount >= 10) {
			session.isCompleted = true;
			session.endingState = `The journey ends here... ${updatedStory}`;
		}

		await session.save();

		res.json({
			storyState: session.isCompleted ? session.endingState : updatedStory,
			isCompleted: session.isCompleted
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

/**
 * End Game Manually
 */
const completeGame = async (req, res) => {
	const { sessionId } = req.body;
	if (!sessionId) return res.status(400).json({ message: "Missing session ID." });

	try {
		let session = await GameSession.findById(sessionId);

		if (!session) return res.status(404).json({ message: "Game session not found." });

		session.isCompleted = true;
		session.endingState = "The game has been manually ended.";

		await session.save();

		res.json({ message: "Game marked as completed.", endingState: session.endingState });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

/**
 * Get Current Game State
 */
const getGameState = async (req, res) => {
	const { sessionId } = req.params;

	try {
		const session = await GameSession.findById(sessionId);

		if (!session) return res.status(404).json({ message: "Game session not found." });

		// Fetch player choices from logs
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const choices = logs.map(log => log.userInput);

		res.json({
			storyState: session.storyState,
			choices,
			isCompleted: session.isCompleted,
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

/**
 * Get All Choices for a Session
 */
const getChoicesForSession = async (req, res) => {
	const { sessionId } = req.params;

	try {
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });

		if (!logs.length) return res.status(404).json({ message: "No choices found for this session." });

		const choices = logs.map(log => log.userInput);

		res.json({ sessionId, choices });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

module.exports = { startGame, playTurn, getGameState, getChoicesForSession, completeGame };
