// api/tracker.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { title, platform, username } = req.query;
  const TRN_API_KEY = process.env.TRN_API_KEY;

  if (!title || !platform || !username)
    return res.status(400).json({ error: "Missing parameters" });

  try {
    const response = await fetch(
      `https://api.tracker.gg/api/v2/${title}/standard/profile/${platform}/${username}`,
      {
        headers: { "TRN-Api-Key": TRN_API_KEY },
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Tracker API error: ${response.statusText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Tracker proxy error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
