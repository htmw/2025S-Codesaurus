const express = require("express");
const { saveStory, getAllStories } = require("../controllers/storyController");

const router = express.Router();

//POST route to create a story
router.post("/story", saveStory);

//GET Stories from mongodb
router.get("/stories", getAllStories);

module.exports = router;