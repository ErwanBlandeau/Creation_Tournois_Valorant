import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username;
    if (!username) {
      return NextResponse.json({ error: "Missing username in body" }, { status: 400 });
    }


    const titleSlug = "valorant";
    const platformSlug = "riot";
    const platformUserIdentifier = encodeURIComponent(username);

    const url = `https://public-api.tracker.gg/api/v1/${titleSlug}/standard/profile/${platformSlug}/${platformUserIdentifier}`;

    const response = await axios.get(url, {
      headers: { "TRN-Api-Key": "5b42ea3c-b339-45ad-808c-71f8e6422de9" }
    });

    // Forward the full tracker.gg response to client
    return NextResponse.json(response.data);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const payload = err?.response?.data || { message: err?.message || "Unknown error" };
    return NextResponse.json({ error: payload }, { status });
  }
}
