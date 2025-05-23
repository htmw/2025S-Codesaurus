const NPC = require("../models/NPC");
const Story = require("../models/Stories");

// POST route to create a new NPC
const saveNPC = async (req, res) => {
    const { title, role, description, backstory, stats, alignment } = req.body;

    // Ensure required fields are provided
    if (!title || !role) {
        return res.status(400).json({ message: "Name and role are required" });
    }

    // Default stats if not provided
    const defaultStats = {
        strength: 2,
        intelligence: 2,
        charisma: 2,
        agility: 2
    };

    const npcStats = stats ? { ...defaultStats, ...stats } : defaultStats;

    try {
        // Create a new NPC with the provided data
        const newNPC = new NPC({
            title,
            role,
            description,
            backstory,
            stats: npcStats,  // Use the stats from the request or default stats
            alignment: alignment || "Neutral",  // Default to "Neutral" if no alignment provided
            imageUrl: req.file?.location || null, // Use the uploaded image URL if available
        });


        // Save the NPC to the database
        await newNPC.save();

        res.status(201).json({
            message: "NPC created successfully",
            npc: newNPC
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET route to fetch all stories
const getAllNPC = async (req, res) => {
    try {
        const npc = await NPC.find().sort({ timestamp: -1 }) // Retrieve all npc sorted by most recent timestamp
        
        if (npc.length === 0) {
            return res.status(404).json({ message: "No npc found" });
        }
        res.status(200).json(npc);  // Return all npcs as JSON
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

};

// PUT route to update the image of an NPC
const updateNPCImage = async (req, res) => {
    try {
        const npcId = req.params.npcId;
        const imageUrl = req.file?.location;

        if (!imageUrl) {
            return res.status(400).json({ message: "Image upload failed" });
        }

        const updatedNPC = await NPC.findByIdAndUpdate(
            npcId,
            { imageUrl },
            { new: true }
        );

        if (!updatedNPC) {
            return res.status(404).json({ message: "NPC not found" });
        }

        res.status(200).json({ message: "Image updated", npc: updatedNPC });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};




module.exports = { saveNPC, getAllNPC, updateNPCImage };
