const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config(); // ✅ Load environment variables (lokal atau Railway)

// === DEBUG: Tampilkan key environment yang tersedia ===
console.log("✅ ENV Loaded Keys:", Object.keys(process.env)); // ⬅️ Tambahan
const API_KEY = process.env.API_KEY;
console.log("✅ ENV API_KEY (TYPE):", typeof API_KEY);
console.log("✅ ENV API_KEY (VALUE):", API_KEY?.substring?.(0, 8) + "..." || "undefined");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";

// === Middleware
app.use(cors({
  origin: "*", // 🔧 Ganti jika ingin batasi ke domain frontend kamu
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-key"]
}));

app.use(bodyParser.json({ limit: '20mb' }));

// === Endpoint: Generate Gambar ===
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

// === Endpoint: Polling Hasil
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

// === Start Server ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server berjalan di http://0.0.0.0:${PORT}`);
});
