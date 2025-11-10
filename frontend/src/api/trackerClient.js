import axios from "axios";

export async function getPlayerProfile(title, platform, username) {
  const baseURL = import.meta.env.PROD ? "/api" : "http://localhost:3000/api";
  const url = `${baseURL}/tracker?title=${title}&platform=${platform}&username=${username}`;

  const res = await axios.get(url);
  return res.data;
}
