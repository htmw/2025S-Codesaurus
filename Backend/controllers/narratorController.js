require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");
const Story = require('../models/Stories')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const maxIterations = 10;

/**
 * AI Narrator Function - Generates AI narration based on past choices
 */
const generateNarration = async (
	playerChoice,
	sessionId,
	storyPrompt,
	diceRollResult = null,
	npcList = "",
	requirements = [],
	forceEnding = false // <-- new parameter
) => {
	try {
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const logCount = await Log.countDocuments({ sessionId: sessionId });
		const previousChoices = logs.map(log => log.userInput);

		// If forceEnding is true, skip to the ending prompt
		if (forceEnding) {
			const Endprompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "requiresRoll": false,
  "threshold": null,
  "narration": "A conclusive ending statement that makes it clear the game is over and nothing remains for the player to do.",
  "End of Game": true
}

Rules:
- The game has now ended. Do NOT progress the story any further.
- The narration must be a final, conclusive ending. Do NOT mention any new paths, choices, unresolved story elements, or anything that hints at further adventure, exploration, or action.
- Do NOT end with a question or suggest further action.
- Use language that makes it clear the adventure is over, such as "The adventure is complete," "Your journey ends here," "There is nothing left to do," or "The tale is finished."
- Set "narration" to a positive, victorious, or peaceful ending, but it must sound like the absolute end.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.
- ABSOLUTELY DO NOT introduce any new events, discoveries, or possibilities for the player. The story must feel completely finished and closed.

NPCs present in the story: ${npcList}
Story setup: "${storyPrompt}"
Player choices so far: [${previousChoices.join(", ")}]
${diceRollResult ? "" : `The player now says: "${playerChoice}"`}
`;
			const endResponse = await openai.chat.completions.create({
				model: "gpt-4",
				messages: [
					{ role: "system", content: "You are a fantasy narrator guiding players to end the game." },
					{ role: "user", content: Endprompt }
				],
				max_tokens: 250,
				temperature: 0.8,
			});

			const finalContent = JSON.parse(endResponse.choices[0].message.content);
			finalContent.requiresRoll = false;
			finalContent["End of Game"] = true;
			return finalContent;
		}

		const prompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "requiresRoll": true | false,
  "threshold": number | null,
  "narration": "string ending with a question unless "End of Game" is true",
  "End of Game": true | false
}

Rules:
- Only set "requiresRoll": true for actions with meaningful uncertainty, physical danger, or skill-based risk.
- Examples: climbing cliffs, disarming traps, attacking enemies.
- Everyday or harmless actions (e.g., talking, exploring, observing, walking) should NOT require a roll.
- Choose a threshold between 1-6 (inclusive) when rolling is necessary.
- narration should be concise (2-3 sentences) and end with an open-ended question.
- Set "End of Game": true and generate the ending narration without a question mark and suitable for ending the game ONLY IN THIS CASE if anything in the past logs seem even slightly similar to meeting these following requirements: ${JSON.stringify(requirements)}.
- Try to guide the player to eventually meet the requirement from the beginning itself in every response as required in this: ${JSON.stringify(requirements)}.
- Make sure when you read the player choices in every response you are very senstive the the player's choices and consider the game as ended even if the choices very slightly resemble the requirements.
- Whenever you decide to set "End of Game": true, make sure the "narration" is suitable for ending the game.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.

NPCs present in the story: ${npcList}

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
		let narrationObj = JSON.parse(content);

		// Prevent dice roll on the 5th iteration
		if (logCount >= maxIterations - 3) { // 0-based index, so 4 is the 5th turn
			narrationObj.requiresRoll = false;
			narrationObj.threshold = null;
		}

		let gameEnd = narrationObj["End of Game"];

		console.log("Log Count: ", logCount);

		if (gameEnd) {
			const Endprompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "requiresRoll": false,
  "threshold": null,
  "narration": "A conclusive ending statement that makes it clear the game is over and nothing remains for the player to do.",
  "End of Game": true
}

Rules:
- The game has now ended. Do NOT progress the story any further.
- The narration must be a final, conclusive ending. Do NOT mention any new paths, choices, unresolved story elements, or anything that hints at further adventure, exploration, or action.
- Do NOT end with a question or suggest further action.
- Use language that makes it clear the adventure is over, such as "The adventure is complete," "Your journey ends here," "There is nothing left to do," or "The tale is finished."
- Set "narration" to a positive, victorious, or peaceful ending, but it must sound like the absolute end.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.
- ABSOLUTELY DO NOT introduce any new events, discoveries, or possibilities for the player. The story must feel completely finished and closed.

NPCs present in the story: ${npcList}
Story setup: "${storyPrompt}"
Player choices so far: [${previousChoices.join(", ")}]
${diceRollResult ? "" : `The player now says: "${playerChoice}"`}
`;
			const endResponse = await openai.chat.completions.create({
				model: "gpt-4",
				messages: [
					{ role: "system", content: "You are a fantasy narrator guiding players to end the game." },
					{ role: "user", content: Endprompt }
				],
				max_tokens: 250,
				temperature: 0.8,
			});

			const finalContent = JSON.parse(endResponse.choices[0].message.content);
			finalContent.requiresRoll = false;
			finalContent["End of Game"] = true;
			return finalContent;
		}

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
		if (!story) return res.status(404).json({ message: "Story not found." });

		const storyState = `The adventure begins...\n${story.prompt}`
		const session = new GameSession({
			storyId,
			storyState,
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
	console.log('npcList: ', npcList);

	const logCount = await Log.countDocuments({ sessionId: session._id });

	let narrationResponse;
	// If ending condition is met, force the ending prompt
	if (playerChoice?.toLowerCase().includes("escape") || logCount >= maxIterations) {
		narrationResponse = await generateNarration(
			playerChoice,
			session._id,
			storyPrompt,
			diceRollResult,
			npcList,
			story.requirements,
			true // <-- pass a flag to force ending
		);
	} else {
		narrationResponse = await generateNarration(
			playerChoice,
			session._id,
			storyPrompt,
			diceRollResult,
			npcList,
			story.requirements
		);
	}

	session.storyState = narrationResponse.narration;
	session.requiresRoll = narrationResponse.requiresRoll;
	session.rollThreshold = narrationResponse.threshold;

	await Log.create({
		sessionId: session._id,
		context: narrationResponse.requiresRoll ? `[Dice roll required]: ${narrationResponse.narration}` : narrationResponse.narration,
		userInput: null
	});

	if (narrationResponse["End of Game"] || playerChoice?.toLowerCase().includes("escape") || logCount >= maxIterations) {
		if (narrationResponse["End of Game"]) {
			session.requirementsMet = true;
		}
		session.isCompleted = true;
		session.endingState = `The journey ends here... ${narrationResponse.narration}`;
		session.storyState = session.endingState;
	}

	await session.save();

	return {
		storyState: session.isCompleted ? session.endingState : narrationResponse.narration,
		requiresRoll: narrationResponse.requiresRoll,
		threshold: narrationResponse.threshold,
		isCompleted: session.isCompleted,
		requirementsMet: session.requirementsMet
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
