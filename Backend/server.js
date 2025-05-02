const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const logRoutes = require("./routes/logRoutes"); // Import routes
const narratorRoutes = require("./routes/narratorRoutes");
const characterRoutes = require("./routes/characterRoutes");
const themeRoutes = require("./routes/themeRoutes"); // Theme routes
const storyRoutes = require("./routes/storyRoutes"); // Story routes
const npcRoutes = require("./routes/npcRoutes"); //NPC routes
const voiceRoutes = require("./routes/voiceRoutes");





const app = express();
const PORT = process.env.PORT || 5000;
const uploadRoutes = require("./routes/uploadRoutes");



app.use(express.json());
app.use(cors());

// MongoDB 
mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err.message);
  console.error("Please check your connection string and credentials");
  process.exit(1); // Exit the process if we can't connect to the database
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api", logRoutes);
app.use("/api", narratorRoutes);
app.use("/api", characterRoutes); //Characters

app.use('/api/voice', voiceRoutes); // TTS and STT

app.use("/api", themeRoutes); //Theme
app.use("/api", storyRoutes); //Story
app.use("/api", npcRoutes); //NPC
app.use("/api", uploadRoutes); // Image upload route
app.listen(PORT, () => console.log(`running on port ${PORT}`));


