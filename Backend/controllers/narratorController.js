require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");
const Story = require('../models/Stories')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Narrator Function - Generates AI narration based on past choices
 */
const generateNarration = async (playerChoice, sessionId, storyPrompt, diceRollResult = null, npcList = "") => {
	try {
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const previousChoices = logs.map(log => log.userInput);
		
		//get session of the game
		const session = await GameSession.findById(sessionId);
		//get story in game session
		const story = await Story.findById(session.storyId).populate("npcIds");

		//Filter Active NPCs
		const activeNpcIds = session.npcStates
		.filter(n => n.isActive)
		.map(n => n.npcId.toString());
		const activeNpcs = story.npcIds.filter(npc =>
		activeNpcIds.includes(npc._id.toString())
		);

		const npcContext = activeNpcs.map(npc =>
			`${npc.title} (${npc.role}): ${npc.description}`
		).join("\n");a

		const prompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "requiresRoll": true | false,
  "threshold": number | null,
  "narration": "string ending with a question"
}

Rules:
- Only set "requiresRoll": true for actions with meaningful uncertainty, physical danger, or skill-based risk.
- Examples: climbing cliffs, disarming traps, attacking enemies.
- Everyday or harmless actions (e.g., talking, exploring, observing, walking) should NOT require a roll.
- Choose a threshold between 1-6 (inclusive) when rolling is necessary.
- narration should be concise (2-3 sentences) and end with an open-ended question.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.

NPCs present in the story: ${npcList}

NPCs currently present in the scene: ${npcContext}

${diceRollResult ?
				`The player's last action required a dice roll.
Dice Result: ${diceRollResult.diceRoll}
Threshold to Succeed: ${diceRollResult.threshold}
Outcome: ${diceRollResult.success ? "Success" : "Failure"}
	`
				: ""}
Story setup: "${storyPrompt}"
Player choices so far: [${previousChoices.join(", ")}]
${diceRollResult ? "" : `The player now says: "${playerChoice}"`}
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
			requiresRoll: false,
			threshold: null,
			narration: "The narrator pauses, as if lost in thought..."
		};
	}
};

const startGame = async (req, res) => {
	const { storyId } = req.body;
	if (!storyId) return res.status(400).json({ message: "Missing story ID." });

	try {
		const story = await Story.findById(storyId).populate("npcIds");
		
		const npcStates = story.npcIds.map(npc => ({
			npcId: npc._id,
			isActive: false // default
		  }));
		  
		if (!story) return res.status(404).json({ message: "Story not found." });

		const storyState = `The adventure begins...\n${story.prompt}`
		const session = new GameSession({
			storyId,
			storyState,
			npcStates,
		});

		await session.save();

		await Log.create({
			sessionId: session._id.toString(),
			context: storyState,
			userInput: null
		});

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

		await addToLastLog(sessionId, playerChoice)

		const response = await processNarration({
			session,
			storyPrompt: session.storyState,
			playerChoice,
		});

		res.json(response);
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

const processNarration = async ({ session, storyPrompt, playerChoice = null, diceRollResult = null }) => {
	// TODO: why does generateNarration need storyPrompt?
	
	//Accepting NPCs
	const story = await Story.findById(session.storyId).populate("npcIds");
	const npcList = story.npcIds.map(npc =>
        `${npc.title} (${npc.role}) - ${npc.description}`
    ).join(", ");

	const narrationResponse = await generateNarration(playerChoice, session._id, storyPrompt, diceRollResult, npcList);

	session.storyState = narrationResponse.narration;
	session.requiresRoll = narrationResponse.requiresRoll;
	session.rollThreshold = narrationResponse.threshold;

	const logCount = await Log.countDocuments({ sessionId: session._id });
	if (playerChoice?.toLowerCase().includes("escape") || logCount >= 10) {
		session.isCompleted = true;
		session.endingState = `The journey ends here... ${narrationResponse.narration}`;
	}

	await session.save();

	await Log.create({
		sessionId: session._id,
		context: narrationResponse.requiresRoll ? `[Dice roll required]: ${narrationResponse.narration}` : narrationResponse.narration,
		userInput: null
	});


	return {
		storyState: session.isCompleted ? session.endingState : narrationResponse.narration,
		requiresRoll: narrationResponse.requiresRoll,
		threshold: narrationResponse.threshold,
		isCompleted: session.isCompleted
	};
};

const addToLastLog = async (sessionId, userInput) => {
	const lastNarratorLog = await Log.findOne({
		sessionId,
		userInput: {
			$in: [null, ""]
		}
	}).sort({ timestamp: -1 });
	if (lastNarratorLog) {
		lastNarratorLog.userInput = userInput;
		await lastNarratorLog.save();
	} else {
		// If no pending log found, fallback to creating a new log
		await Log.create({
			sessionId,
			context: null,
			userInput
		});
	}
}

const rollDice = async (req, res) => {
	const { sessionId } = req.body;
	if (!sessionId) return res.status(400).json({ message: "Missing session ID." });

	try {
		const session = await GameSession.findById(sessionId);
		if (!session || !session.requiresRoll) {
			return res.status(400).json({ message: "No roll required for this session." });
		}

		const diceRoll = Math.floor(Math.random() * 6) + 1;
		const success = diceRoll >= session.rollThreshold;
		const userInput = `Player rolled a ${diceRoll} (threshold: ${session.rollThreshold}) — ${success ? "Success" : "Failure"}`;
		await addToLastLog(sessionId, userInput)

		const story = await Story.findById(session.storyId);

		const response = await processNarration({
			session,
			storyPrompt: story.prompt,
			diceRollResult: { success, diceRoll, threshold: session.rollThreshold }
		});

		res.json({
			diceRoll,
			diceUserMessage: userInput,
			rollThreshold: session.rollThreshold,
			success,
			message: success
				? "🎲 Success! Your action goes as planned."
				: "🎲 Failure. Your attempt didn't quite succeed.",
			...response
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
			requiresRoll: session.requiresRoll || false,
			threshold: session.rollThreshold || null,
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

module.exports = { startGame, playTurn, getGameState, getChoicesForSession, completeGame, rollDice };
