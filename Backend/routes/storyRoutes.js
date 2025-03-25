const express = require("express");
const { saveStory, getAllStories, getStoryById } = require("../controllers/storyController");

const router = express.Router();

//POST route to create a story
router.post("admin/story", saveStory);

//GET Stories from mongodb
router.get("/stories", getAllStories);

//GET Stories from their Id
router.get("/stories/:id", getStoryById);

module.exports = router;