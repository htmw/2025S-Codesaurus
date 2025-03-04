const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); 
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

// MongoDB 
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("connection error:", err));

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.listen(PORT, () => console.log(`running on port ${PORT}`));
