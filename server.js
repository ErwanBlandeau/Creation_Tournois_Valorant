import express from "express";
import axios from "axios";
import cors from "cors";

// NOTE: This file is kept for local development only.
// For deployment on Vercel we provide a serverless function in `api/valorant/profile.js`.
// The TRN API key should be set in environment variables (TRN_API_KEY).

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static("public"));

// Endpoint API (local fallback)
app.get("/api/valorant/profile", async (req, res) => {
  const tag = req.query.tag; // ex: loulou28%2312345

  if (!tag) {
    return res.status(400).json({ message: "Missing 'tag' query parameter" });
  }

  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) {
    console.warn("Warning: TRN_API_KEY not set. Requests to Tracker.gg will fail without a key.");
    return res.status(500).json({ message: "Server missing TRN_API_KEY environment variable" });
  }

  try {
    const response = await axios.get(
      `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${tag}`,
      {
        headers: {
          "TRN-Api-Key": apiKey,
        },
      }
    );

    console.log("API Response:", response.data?.data ? "(data)" : response.data);
    res.json(response.data);
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Unknown error" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Serveur local lancé sur http://localhost:${PORT} (use TRN_API_KEY env var)`)
);
