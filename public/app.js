document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("getStatsBtn");
  const input = document.getElementById("riotTag");
  const output = document.getElementById("output");

  button.addEventListener("click", async () => {
    const riotTag = input.value.trim();
    if (!riotTag.includes("#")) {
      output.textContent = "⚠️ Entrez un Riot ID au format Nom#Tag (ex: loulou28#12345)";
      return;
    }

    const encodedTag = encodeURIComponent(riotTag);

    try {
      const res = await fetch(`/api/valorant/profile?tag=${encodedTag}`);
      const data = await res.json();

      if (res.ok) {
        output.textContent = JSON.stringify(data, null, 2);
      } else {
        output.textContent = `❌ Erreur ${res.status}: ${data.message || "API Error"}`;
      }
    } catch (err) {
      output.textContent = "Erreur de connexion : " + err.message;
    }
  });
});
