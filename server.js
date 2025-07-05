const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config(); // ✅ Load .env

const app = express();
const PORT = 3000;
const API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";
const API_KEY = process.env.API_KEY; // ✅ Ambil dari .env

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

// === IMAGE-BASED EDITING ONLY ===
app.post("/generate-image", async (req, res) => {
  const { prompt, input_image } = req.body;

  if (!prompt || !input_image) {
    return res.status(400).json({ error: "Prompt dan input_image harus diisi." });
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "x-key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        input_image,
        aspect_ratio: "1:1",
        output_format: "jpeg"
      })
    });

    const text = await response.text();
    console.log("🔁 Response dari BFL API:", text);

    if (!response.ok) {
      return res.status(response.status).json({ error: "API error", responseText: text });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("❌ Error di server /generate-image:", err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// === POLLING HANDLER ===
app.get("/poll", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Polling URL tidak ditemukan." });
  }

  try {
    console.log("[/poll] Polling ke:", url);
    const poll = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-key": API_KEY
      }
    });

    const pollData = await poll.json();
    console.log("[/poll] Response:", pollData);

    res.json(pollData);
  } catch (err) {
    console.error("❌ Error di /poll:", err);
    res.status(500).json({ error: "Polling error", detail: err.message });
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
