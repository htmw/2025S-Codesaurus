require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");
const Story = require('../models/Stories')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Narrator Function - Generates AI narration based on past choices
 */
const generateNarration = async (playerInput, sessionId, storyPrompt) => {
	try {
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const previousChoices = logs.map(log => log.userInput);

		const prompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "narration": "string ending with a question"
}

Rules:
- narration should be concise (2–3 sentences) and end with an open-ended question.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.

Story setup: "${storyPrompt}"
Player choices so far: [${previousChoices.join(", ")}]
The player now says: "${playerInput}"
		`;

		const response = await openai.chat.completions.create({
			model: "gpt-4",
			messages: [
				{ role: "system", content: "You are a fantasy narrator guiding players." },
				{ role: "user", content: prompt }
			],
			max_tokens: 250,
			temperature: 0.8,
		});

		const content = response.choices[0].message.content;
		return JSON.parse(content);
	} catch (error) {
		console.error("OpenAI API error:", error);
		return {
			narration: "The narrator pauses, as if lost in thought..."
		};
	}
};

const startGame = async (req, res) => {
	const { storyId } = req.body;
	if (!storyId) return res.status(400).json({ message: "Missing story ID." });

	try {
		const story = await Story.findById(storyId);
		if (!story) return res.status(404).json({ message: "Story not found." });

		const session = new GameSession({
			storyId,
			storyState: `The adventure begins...\n${story.prompt}`,
		});

		await session.save();

		res.json({
			message: `Game started: ${story.title}`,
			sessionId: session._id.toString(),
			storyState: session.storyState,
		});
	} catch (err) {
		console.error("Server Error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

const playTurn = async (req, res) => {
	const { sessionId, playerChoice } = req.body;
	if (!sessionId || !playerChoice) return res.status(400).json({ message: "Missing session ID or player choice." });

	try {
		let session = await GameSession.findById(sessionId);
		if (!session) return res.status(404).json({ message: "Game session not found." });

		if (session.isCompleted) {
			return res.json({ message: "Game has already ended.", endingState: session.endingState });
		}

		await Log.create({ sessionId, context: session.storyState, userInput: playerChoice });

		const narrationResponse = await generateNarration(playerChoice, sessionId, session.storyState);

		session.storyState = narrationResponse.narration;

		await session.save();

		res.json({
			storyState: session.isCompleted ? session.endingState : narrationResponse.narration,
			isCompleted: session.isCompleted
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

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

const getGameState = async (req, res) => {
	const { sessionId } = req.params;

	try {
		const session = await GameSession.findById(sessionId);
		if (!session) return res.status(404).json({ message: "Game session not found." });

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
