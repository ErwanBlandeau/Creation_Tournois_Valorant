export async function fetchValorantProfile(username: string) {
  const res = await fetch(`/api/trn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  if (!res.ok) {
    // try to parse error
    let text: any = await res.text();
    try { text = JSON.parse(text); } catch (_) {}
    throw new Error(typeof text === "string" ? text : JSON.stringify(text));
  }

  return res.json();
}
