import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body?.username || "").toString().trim();
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const titleSlug = "valorant";
    const platformSlug = "riot"; // Tracker uses 'riot' for Riot/Valorant
    const encodedIdentifier = encodeURIComponent(username);

    const url = `https://public-api.tracker.gg/api/v1/${titleSlug}/standard/profile/${platformSlug}/${encodedIdentifier}`;

    const apiKey = process.env.TRN_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing TRN_API_KEY environment variable" }, { status: 500 });
    }

    const resp = await axios.get(url, {
      headers: {
        "TRN-Api-Key": apiKey,
      },
      timeout: 10_000,
    });

    // Return the raw tracker.gg response payload
    return NextResponse.json(resp.data);
  } catch (err: any) {
    // Prefer the detailed response body from axios if available
    const details = err?.response?.data || err?.message || String(err);
    return NextResponse.json({ error: details }, { status: 500 });
  }
}
