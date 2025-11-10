import axios from "axios";

// Vercel serverless function: GET /api/valorant/profile?tag=<riotTag>
// Reads TRN API key from process.env.TRN_API_KEY (set this in Vercel dashboard).

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { tag } = req.query;
  if (!tag) return res.status(400).json({ message: "Missing 'tag' query parameter" });

  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) return res.status(500).json({ message: "Missing TRN_API_KEY environment variable" });

  try {
    const response = await axios.get(
      `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${tag}`,
      { headers: { "TRN-Api-Key": apiKey } }
    );

    // Allow cross-origin access from the static site
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(response.data);
  } catch (err) {
    console.error("Tracker API error:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { message: "Unknown error" });
  }
}
