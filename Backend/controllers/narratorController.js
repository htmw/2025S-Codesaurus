require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");
const Story = require('../models/Stories');
const Character = require("../models/Character");
const { createCharacterInDB } = require("./characterController");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_ITERATIONS = 3;
/**
 * AI Narrator Function - Generates AI narration based on past choices
 */
const generateNarration = async ({
	playerChoices = [],
	sessionId,
	storyPrompt,
	diceRollResult = null,
	npcList = "",
	requirements = []
}) => {
	try {
		const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });
		const previousChoices = logs.map(log => log.userInput);
		const shouldForceEnd = logs.length >= MAX_ITERATIONS;

		// Fetch character (first one for now — for prompt context)
		const character = await Character.findOne({ gameSessionId: sessionId });
		const characterJSON = character
			? JSON.stringify({
				name: character.name,
				race: character.race,
				class: character.class,
				background: character.background,
				stats: character.stats
			}, null, 2)
			: "null";

		const formattedInput = Array.isArray(playerChoices)
			? playerChoices.map(p => `${p.characterId}: "${p.choice}"`).join(" | ")
			: playerChoices;

		const prompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this JSON format:
{
  "requiresRoll": true | false,
  "threshold": number | null,
  "narration": "string ending with a question unless 'End of Game' is true",
  "End of Game": true | false
}

Rules:
- Only set "requiresRoll": true for actions with meaningful uncertainty, physical danger, or skill-based risk.
- Examples: climbing cliffs, disarming traps, attacking enemies.
- Everyday or harmless actions (e.g., talking, exploring, observing, walking) should NOT require a roll.
- Choose a threshold between 1-6 (inclusive) when rolling is necessary.
- The player's character is provided as JSON and includes attributes such as class, race, background, and stats.
- Mention the character's background or class in narration if contextually relevant, to enhance immersion.
- Do not contradict the player's stats in narration. For example, avoid describing clumsiness if dexterity is high.
- Use the following mapping for stat relevance:
    - Physical actions → strength, dexterity, constitution
    - Mental/magical actions → intelligence, wisdom
    - Social/influence actions → charisma
- If the character has high relevant stats (≥ 4), consider lowering thresholds or removing dice rolls entirely for appropriate actions.
- If the character has low relevant stats (≤ 2), make success more difficult or describe risks accordingly.
- narration should be concise (2-3 sentences) and end with an open-ended question.
- Set "End of Game": true and generate the ending narration without a question mark and suitable for ending the game ONLY IN THIS CASE if anything in the past logs seem even slightly similar to meeting these following requirements: ${JSON.stringify(requirements)}.
- Try to guide the player to eventually meet the requirement from the beginning itself in every response as required in this: ${JSON.stringify(requirements)}.
- Make sure when you read the player choices in every response you are very sensitive to the player's choices and consider the game as ended even if the choices very slightly resemble the requirements.
- Whenever you decide to set "End of Game": true, make sure the "narration" is suitable for ending the game.
- NPCs must only be mentioned or referenced if they were already introduced to the player earlier in the story or are contextually entering the scene for the first time.
- Do NOT assume the player already knows who an NPC is unless the NPC was described or interacted with earlier.
- When introducing a new NPC for the first time, clearly state their name, role, and basic description in the narration.
- Avoid using phrases like "as you already know" or referring to past interactions with NPCs that did not actually happen.
- Do NOT explain anything outside the JSON. No extra text.
- Do NOT offer predefined choices.
${shouldForceEnd ? `
- This story has gone on for too long without resolution. You MUST end the game now with a loss for the player.
- Set "End of Game": true and write a graceful defeat narration without a question mark.
- Do not give the player another choice or prompt.` : ""}

NPCs present in the story: ${npcList}

Player Character JSON:
${characterJSON}

${diceRollResult ? `
The player's last action required a dice roll.
Dice Result: ${diceRollResult.diceRoll}
Threshold to Succeed: ${diceRollResult.threshold}
Outcome: ${diceRollResult.success ? "Success" : "Failure"}
` : ""}

Story setup: "${storyPrompt}"
Player choices so far: [${previousChoices.join(", ")}]
${diceRollResult ? "" : `The player(s) now say: "${formattedInput}"`}
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
	const { storyId, characters } = req.body;

	if (!storyId) return res.status(400).json({ message: "Missing story ID." });
	if (!Array.isArray(characters) || characters.length === 0) {
		return res.status(400).json({ message: "At least one character is required." });
	}

	try {
		const story = await Story.findById(storyId).populate("npcIds");
		if (!story) return res.status(404).json({ message: "Story not found." });

		if (characters.length > story.maxPlayers) {
			return res.status(400).json({ 
				message: `Maximum ${story.maxPlayers} players allowed for this story.` 
			});
		}

		// Step 1: Create Game Session
		const storyState = `The adventure begins...\n${story.prompt}`;
		const session = new GameSession({
			storyId,
			storyState,
		});
		await session.save();

		// Step 2: Create Characters and link to session
		const createdCharacters = [];

		for (const charData of characters) {
			const newCharacter = await createCharacterInDB({
				name: charData.name,
				race: charData.race,
				characterClass: charData.class,
				background: charData.background,
				stats: charData.stats,
				gameSessionId: session._id,
			});
			createdCharacters.push(newCharacter);
		}

		// Step 3: Create initial log
		await Log.create({
			sessionId: session._id.toString(),
			context: storyState,
			userInput: null, // Should we add all characters' names here?
		});

		// Step 4: Respond
		res.json({
			message: `Game started: ${story.title}`,
			sessionId: session._id.toString(),
			storyState: session.storyState,
			characters: createdCharacters.map((char) => ({
				characterId: char._id,
				name: char.name,
				class: char.class,
				race: char.race,
			})),
		});

	} catch (err) {
		console.error("Server Error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};


const playTurn = async (req, res) => {
	const { sessionId, playerChoices } = req.body;

	if (!sessionId || !Array.isArray(playerChoices) || playerChoices.length === 0) {
		return res.status(400).json({ message: "Missing or invalid session ID or player choices." });
	}

	try {
		let session = await GameSession.findById(sessionId);
		if (!session) return res.status(404).json({ message: "Game session not found." });

		if (session.isCompleted) {
			return res.json({ message: "Game has already ended.", endingState: session.endingState });
		}

		const formattedInputs = playerChoices.map(p => `${p.characterId}: ${p.choice}`);
		const combinedLogMessage = formattedInputs.join(" | ");

		await addToLastLog(sessionId, combinedLogMessage);

		const response = await processNarration({
			session,
			storyPrompt: session.storyState,
			playerChoices,
		});

		res.json(response);
	} catch (err) {
		console.error("playTurn error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};


const processNarration = async ({ session, storyPrompt, playerChoices = null, diceRollResult = null }) => {
	const story = await Story.findById(session.storyId).populate("npcIds");

	const npcList = story.npcIds.map(npc =>
		`${npc.title} (${npc.role}) - ${npc.description}`
	).join(", ");

	const formattedChoiceString = playerChoices
		? playerChoices.map(p => `${p.characterId}: ${p.choice}`).join(" | ")
		: null;

	const containsEscape = playerChoices
		? playerChoices.some(p => p.choice.toLowerCase().includes("escape"))
		: false;

	const narrationResponse = await generateNarration(
		formattedChoiceString || playerChoices?.[0]?.choice || "", // fallback for safety
		session._id,
		storyPrompt,
		diceRollResult,
		npcList,
		story.requirements
	);

	session.storyState = narrationResponse.narration;
	session.requiresRoll = narrationResponse.requiresRoll;
	session.rollThreshold = narrationResponse.threshold;

	const logCount = await Log.countDocuments({ sessionId: session._id });

	if (narrationResponse["End of Game"] || containsEscape || logCount >= MAX_ITERATIONS) {
		if (narrationResponse["End of Game"]) {
			session.requirementsMet = true;
		}
		session.isCompleted = true;
		session.endingState = `${narrationResponse.narration}`;
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
