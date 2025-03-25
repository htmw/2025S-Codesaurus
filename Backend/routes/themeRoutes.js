const express = require("express");
const { saveTheme, getAllThemes, getThemebyId } = require("../controllers/themeController"); 

const router = express.Router();

// POST route to create a theme
router.post("admin/themes", saveTheme);

// GET route to fetch all themes
router.get("/themes", getAllThemes);

// GET route to fetch all themes by their id
router.get("/themes/:id", getThemebyId);

module.exports = router;
