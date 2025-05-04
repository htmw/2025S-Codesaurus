const axios = require("axios");
const FormData = require("form-data");

exports.transcribeAudio = async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("file", Buffer.from(req.file.buffer), {
        filename: req.file.originalname || "audio.mp3",
        contentType: "audio/mpeg"
      });
      
    formData.append("model", "whisper-1");
    console.log("Received file:", req.file.mimetype, req.file.originalname);


    const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Transcription error:", error.response?.data || error.message);
    res.status(500).json({ error: "Transcription failed" });
  }
};

exports.synthesizeSpeech = async (req, res) => {
  try {
    const { text } = req.body;

    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1",
        input: text,
        voice: "alloy", // You can change voice model if you want
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    res.set("Content-Type", "audio/mpeg");
    res.send(response.data);
  } catch (error) {
    console.error("Synthesis error:", error.response?.data || error.message);
    res.status(500).json({ error: "Speech synthesis failed" });
  }
};
