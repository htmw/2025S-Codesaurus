const express = require("express");
const { saveLog, getAllLogs, getLogsBySession} = require("../controllers/logController");

const router = express.Router();

//store logs to mongoDB
/*
expects:
{
    "context": "The knight enters a dark cave.",
    "userInput": "He lights a torch and looks around."
}
*/
router.post("/logs", saveLog);

//Get Logs from mongodb
router.get("/logs", getAllLogs);

//get logs by sessionID
router.get("/logs/:sessionId", getLogsBySession);

module.exports = router;