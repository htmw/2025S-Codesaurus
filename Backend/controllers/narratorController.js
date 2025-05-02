require("dotenv").config();
const { OpenAI } = require("openai");
const GameSession = require("../models/GameSession");
const Log = require("../models/Logs");
const Story = require('../models/Stories');
const Character = require("../models/Character");
const PlayerAction = require("../models/PlayerAction");

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
	requirements = [],
	forceEnding = false
}) => {
	try {
		const logs = await Log.find({ sessionId })
			.sort({ timestamp: 1 })
			.populate({
				path: "userInput",
			});
		const logCount = await Log.countDocuments({ sessionId: sessionId });
		const shouldForceEnd = logs.length >= MAX_ITERATIONS;
		const previousChoices = logs
			.filter(log => log.userInput || log.diceRollResult)
			.map(log => ({
				context: log.context,
				userInput: log.userInput?.moves?.map(move => ({
					playerId: move.characterId._id.toString(),
					choice: move.input
				})) || [],
				diceRollResult: log.diceRollResult
					? diceRollMessage(log.diceRollResult.diceRoll, log.diceRollResult.threshold)
					: null
			}));

		const characters = await Character.find({ gameSessionId: sessionId });
		const charactersArray = characters.map(character => ({
			characterId: character._id.toString(),
			name: character.name,
			race: character.race,
			class: character.class,
			background: character.background,
			stats: character.stats
		}));

		const prompt = `
You are an AI Dungeon Master for a fantasy text-based game.
Respond ONLY in this exact JSON format:
{
  "requiresRoll": true | false,
  "threshold": number | null,
  "narration": "string ending with a question unless 'End of Game' is true",
  "End of Game": true | false,
  "npcInScene": [ "npcId1", "npcId2" ]
}

Rules:
- Only set "requiresRoll": true for actions involving meaningful uncertainty, immediate physical danger, or skill-based challenge.
- Examples that require a roll: climbing cliffs, disarming traps, attacking enemies, risky spellcasting, dangerous negotiations under pressure.
- Preparation actions (e.g., drawing weapons, taking cover, preparing spells, bracing for battle) MUST NOT require a roll. They are narrative setup only.
- Walking, observing, talking, moving to safe locations are safe actions and MUST NOT require a roll.
- Threshold for rolls should be between 1-6 (inclusive) when necessary.
- Adjust threshold based on relevant player stats:
    - Higher stats (≥ 4): lower or no threshold needed
    - Lower stats (≤ 2): increase difficulty
- Mapping for stat relevance:
    - Physical actions → strength, dexterity, constitution
    - Mental/magical actions → intelligence, wisdom
    - Social/influence actions → charisma
- Ask: "Can this action logically fail in a way that matters?" If not, it must NOT trigger a dice roll.

- Before setting "requiresRoll": true, verify:
  - Is there a meaningful consequence to failure?
  - Is the action contested, difficult, or dangerous?
If not, set "requiresRoll": false.

- If "requiresRoll" is true, the narration MUST clearly indicate what the challenge is and why success is uncertain.
- This can include:
    - the danger involved,
    - the difficulty of the task,
    - the urgency or tension of the moment.
- Example: "You begin to climb the slippery rock wall, each step more treacherous than the last..." or "The guard narrows his eyes, clearly suspicious of your tone..."
- This explanation should be part of the narration (not a separate field).
- narration must be concise (2-3 sentences) and end with an open-ended question (unless ending the game).
- narration should mention the character's class or background if relevant, but never contradict their stats.
- Do not offer predefined choices.
- Do NOT explain anything outside the JSON format. No extra commentary.
- After generating narration, determine which NPCs are actively present in the scene.
- Add their MongoDB IDs to a new array field: "npcInScene".
- Use only NPCs provided in the NPC list.
- Do not invent NPCs or IDs.
- Do not include NPCs that are not in the list.
- Whenever NPC is in scene, make their presence clear in the narration.

Ending Rules:
- If player actions (even slightly) match these requirements: ${JSON.stringify(requirements)}
    - Set "End of Game": true.
    - narration must not end with a question mark, and must feel final/suitable for an ending.
    - Be highly sensitive to matching player choices against these requirements.
- Always subtly guide players toward meeting the requirements when possible.
${shouldForceEnd ? `
- The story has continued too long without resolution.
- You MUST end the game now with a graceful defeat narration (no question mark).
- Do not offer another choice or prompt.` : ""}

NPC Handling Rules:
- NPCs must only be mentioned if they have been previously introduced or are contextually entering the scene for the first time.
- When introducing a new NPC:
    - Clearly state their name, role, and a basic description.
- Do not assume prior knowledge of an NPC.
- Avoid phrases like "as you already know" or false memories.

Game Setup:
NPCs present in the story: ${npcList}

NPCs inScene: 

Playable characters in the game:
${JSON.stringify(charactersArray, null, 2)}

${diceRollResult ? `
The player's last action required a dice roll:
- Threshold to Succeed: ${diceRollResult.threshold}
- Outcome: ${diceRollResult.success ? "Success" : "Failure"}
- Dice Roll Result: ${diceRollResult.diceRoll}
` : `
The player(s) just made choices based on the previous narration.
`}

Story setup:
"${storyPrompt}"

Player choices so far:
${JSON.stringify(previousChoices, null, 2)}
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
		if (logCount >= MAX_ITERATIONS - 3) { // 0-based index, so 4 is the 5th turn
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
Player choices so far:
${JSON.stringify(previousChoices, null, 2)}
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
		throw new Error("Failed to generate narration from OpenAI API.");
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
	/*
		playerChoices = [
			{ characterId: "characterId1", choice: "user's input" },
			{ characterId: "characterId2", choice: "user's input" }
		]	
	*/
	if (!sessionId || !Array.isArray(playerChoices) || playerChoices.length === 0) {
		return res.status(400).json({ message: "Missing or invalid session ID or player choices." });
	}

	try {
		let session = await GameSession.findById(sessionId);
		if (!session) return res.status(404).json({ message: "Game session not found." });

		if (session.isCompleted) {
			return res.json({ message: "Game has already ended.", endingState: session.endingState });
		}

		await addToLastLog(sessionId, playerChoices ?? []);

		const response = await processNarration({
			session,
			playerChoices,
		});

		res.json(response);
	} catch (err) {
		console.error("playTurn error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};


const processNarration = async ({ session, playerChoices = null, diceRollResult = null }) => {
	const story = await Story.findById(session.storyId).populate("npcIds");

	//inclue npc ids in the npcList****
	//In prompt refer toggle should refer to NPC id in the json format array
	const npcList = story.npcIds.map(npc =>
		`${npc.title} [${npc._id}] (${npc.role}) - ${npc.description}`
	).join(", ");

	// TODO: escape logic seems to be broken, fix it later
	const containsEscape = playerChoices
		? playerChoices.some(p => p.choice.toLowerCase().includes("escape"))
		: false;

	const logCount = await Log.countDocuments({ sessionId: session._id });

	const narrationResponse = await generateNarration({
		sessionId: session._id,
		storyPrompt: story.prompt,
		diceRollResult,
		npcList,
		requirements: story.requirements,
		forceEnding: containsEscape || logCount >= MAX_ITERATIONS
	});

	session.storyState = narrationResponse.narration;
	session.requiresRoll = narrationResponse.requiresRoll;
	session.rollThreshold = narrationResponse.threshold;

	if (narrationResponse["End of Game"] || containsEscape || logCount >= MAX_ITERATIONS) {
		if (narrationResponse["End of Game"]) {
			session.requirementsMet = true;
		}
		session.isCompleted = true;
		session.endingState = narrationResponse.narration;
		session.storyState = session.endingState;
	}

	await session.save();

	await Log.create({
		sessionId: session._id,
		context: narrationResponse.requiresRoll
			? `[Dice roll required]: ${narrationResponse.narration}`
			: narrationResponse.narration,
		userInput: null,
		diceRollResult: narrationResponse.requiresRoll
			? {
				diceRoll: null,
				threshold: narrationResponse.threshold,
				success: null
			}
			: undefined,
		npcInScene: narrationResponse.npcInScene || []
	});

	return {
		storyState: session.isCompleted ? session.endingState : narrationResponse.narration,
		requiresRoll: narrationResponse.requiresRoll,
		threshold: narrationResponse.threshold,
		isCompleted: session.isCompleted,
		requirementsMet: session.requirementsMet,
		npcInScene: narrationResponse.npcInScene || []
	};
};


const addToLastLog = async (sessionId, playerChoices) => {
	const lastNarratorLog = await Log.findOne({
		sessionId,
		userInput: null
	}).sort({ timestamp: -1 });

	if (lastNarratorLog) {
		const playerAction = await PlayerAction.create({
			logId: lastNarratorLog._id,
			moves: playerChoices.map(choice => ({
				characterId: choice.characterId,
				input: choice.choice
			}))
		});

		lastNarratorLog.userInput = playerAction._id;
		await lastNarratorLog.save();
	} else {
		throw new Error("No pending narrator log found. Cannot add player choices without narrator context.");
	}
};

const diceRollMessage = (diceRoll, threshold) => {
	return `Player rolled a ${diceRoll} (threshold: ${threshold}) — ${diceRoll >= threshold ? "Success" : "Failure"}`
}

const rollDice = async (req, res) => {
	const { sessionId } = req.body;
	if (!sessionId) return res.status(400).json({ message: "Missing session ID." });

	try {
		const session = await GameSession.findById(sessionId);
		if (!session || !session.requiresRoll) {
			return res.status(400).json({ message: "No roll required for this session." });
		}

		// Step 1: Roll the dice
		const diceRoll = Math.floor(Math.random() * 6) + 1;
		const success = diceRoll >= session.rollThreshold;

		// Step 2: Update the latest narrator log with the dice roll result
		const lastLog = await Log.findOne({
			sessionId,
			"diceRollResult.diceRoll": null
		}).sort({ timestamp: -1 });

		if (!lastLog) {
			return res.status(400).json({ message: "No pending dice roll log found." });
		}

		lastLog.diceRollResult.diceRoll = diceRoll;
		lastLog.diceRollResult.success = success;
		await lastLog.save();

		// Step 3: Update GameSession to clear roll requirement
		session.requiresRoll = false;
		session.rollThreshold = null;
		await session.save();

		// Step 4: Continue narration after dice result
		const response = await processNarration({
			session,
			diceRollResult: { success, diceRoll, threshold: lastLog.diceRollResult.threshold }
		});

		const diceUserMessage = diceRollMessage(diceRoll, lastLog.diceRollResult.threshold);

		res.json({
			diceRoll,
			rollThreshold: session.rollThreshold,
			success,
			message: diceUserMessage,
			...response
		});

	} catch (err) {
		console.error("rollDice error:", err);
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

const formatLogMessage = (log) => {
	if (log.userInput) {
		return log.userInput.moves
			.map(move => `${move.characterId.name}: "${move.input}"`)
			.join(" \n ");
	} else if (log?.diceRollResult?.diceRoll) {
		return diceRollMessage(log.diceRollResult.diceRoll, log.diceRollResult.threshold);
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
		const characters = await Character.find({ gameSessionId: sessionId });

		if (!session) return res.status(404).json({ message: "Game session not found." });

		const logs = await Log.find({ sessionId })
			.sort({ timestamp: 1 })
			.populate({
				path: "userInput",
				populate: {
					path: "moves.characterId",
				}
			});

		// Format logs cleanly for frontend
		const formattedLogs = logs
			.map(log => ({
				context: log.context,
				userInput: formatLogMessage(log),
				npcInScene: log.npcInScene || [],
			}))
		// console.log('formattedLogs: ', JSON.stringify(formattedLogs, null, 2));

		res.json({
			storyState: session.storyState,
			isCompleted: session.isCompleted,
			requiresRoll: session.requiresRoll,
			rollThreshold: session.rollThreshold,
			logs: formattedLogs,
			characters: characters.map(character => ({
				characterId: character._id.toString(),
				name: character.name,
				class: character.class,
				race: character.race,
				stats: character.stats,
			})),
		});
	} catch (err) {
		console.error("getGameState error:", err);
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
