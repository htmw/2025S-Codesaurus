const express = require("express");
const { saveTheme, getAllThemes } = require("../controllers/themeController"); 

const router = express.Router();

// POST route to create a theme
router.post("/themes", saveTheme);

// GET route to fetch all themes
router.get("/themes", getAllThemes);

module.exports = router;
