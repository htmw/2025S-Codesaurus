const Log = require("../models/Logs");

const saveLog = async (req, res) => {
   
        const { context, userInput } = req.body;
        const logEntry = new Log({ context, userInput });
        await logEntry.save();
        res.status(201).json({ message: "Log saved successfully" });
};

const getAllLogs = async (req, res) => {
        const logs = await Log.find().sort({ timestamp: 1 }); // Sort by oldest first
        if (logs.length === 0) {
            return res.status(404).json({ message: "No logs found" });
        }
        res.status(200).json(logs);
};

const getLogsBySession = async (req, res) => {
            const { sessionId } = req.params;
            const logs = await Log.find({ sessionId }).sort({ timestamp: 1 });  
            res.status(200).json(logs);
    };

module.exports = { saveLog, getAllLogs , getLogsBySession };