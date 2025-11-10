export async function fetchValorantProfile(username: string) {
  const res = await fetch("/api/trn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}
