// Script principal pour créer des équipes équilibrées.
// Mode d'emploi :
// - Entrez une liste de joueurs dans le textarea (une par ligne).
// - Optionnel: après le nom, ajoutez |score (par exemple: Joueur#1234|75) ou |rankName (ex: Joueur#1234|Gold).
// - Cochez "Utiliser Tracker.gg" et fournissez votre clé si vous voulez que le script tente de récupérer le rang réel.

const playersEl = document.getElementById('players');
const numTeamsEl = document.getElementById('numTeams');
const apiKeyEl = document.getElementById('apiKey');
const useTrackerEl = document.getElementById('useTracker');
const createBtn = document.getElementById('createBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsEl = document.getElementById('results');

// Buttons for improved UI (insert example / clear list)
const insertSampleBtn = document.getElementById('insertSampleBtn');
const clearPlayersListBtn = document.getElementById('clearPlayersListBtn');

createBtn.addEventListener('click', async () => {
  resultsEl.innerHTML = '';
  const raw = playersEl.value.trim();
  if(!raw){ resultsEl.innerHTML = '<p class="small">Aucun joueur détecté.</p>'; return }
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const numTeams = Math.max(2, parseInt(numTeamsEl.value)||2);

  // Parse players (name and optional score/rank)
  let parsed = lines.map(line=>{
    const parts = line.split('|').map(p=>p.trim());
    return {raw:parts[0], extra:parts[1]||null};
  });

  // Convert extras to numeric score when possible; default score = 50
  const apiKey = apiKeyEl.value.trim();
  const useTracker = useTrackerEl.checked && apiKey;

  // Map common rank names to numeric score (0-100)
  const rankMap = {
    'iron':10,'bronze':25,'silver':35,'gold':50,'platinum':60,'diamond':75,'ascendant':82,'immortal':92,'radiant':100
  };

  async function fetchScoreFromTracker(tag){
    // Try a local proxy first (to avoid CORS issues). If that fails, fall back to the public Tracker.gg API
    // Local proxy endpoint: http://localhost:3000/api/valorant/profile?tag={encodedTag}
    // Public endpoint: https://public-api.tracker.gg/v2/valorant/standard/profile/riot/{encodedTag}
    try{
      const encoded = encodeURIComponent(tag);
      // Try local proxy
      let res = null;
      try{
        const localUrl = `http://localhost:3000/api/valorant/profile?tag=${encoded}`;
        res = await fetch(localUrl);
        // If proxy is not running, this may throw or return non-ok
        if(!res.ok) throw new Error('Local proxy returned ' + res.status);
      } catch(localErr){
        // Fallback to public API if API key provided
        if(apiKey){
          const publicUrl = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${encoded}`;
          res = await fetch(publicUrl, {headers: {'TRN-Api-Key': apiKey}});
          if(!res.ok) throw new Error('Public API returned ' + res.status);
        } else {
          console.warn('Local proxy not available and no API key provided');
          return null;
        }
      }
      const data = await res.json();
      // Try to extract a rank string or numeric rating
      // Several possible places: data.data.segments[0].stats.rank or metadata
      if(data && data.data && Array.isArray(data.data.segments)){
        for(const seg of data.data.segments){
          // Attempt known fields
          if(seg && seg.stats){
            // try rating or rank
            const keys = Object.keys(seg.stats);
            for(const k of keys){
              const name = k.toLowerCase();
              if(name.includes('rank') || name.includes('rating') || name.includes('mmr')){
                const val = seg.stats[k];
                // val may be object with "displayValue" or numeric value
                if(typeof val === 'object'){
                  const dv = (val.displayValue || '').toString();
                  const num = parseInt(dv.replace(/[^0-9]/g,''));
                  if(!isNaN(num)) return Math.min(100, Math.max(0, num));
                  // try mapping by name
                  const lname = dv.toLowerCase();
                  for(const rk in rankMap) if(lname.includes(rk)) return rankMap[rk];
                } else if(typeof val === 'number'){
                  return Math.min(100, Math.max(0, Math.round(val)));
                }
              }
            }
          }
          // fallback to metadata rankName
          if(seg && seg.metadata){
            const meta = seg.metadata;
            if(meta && meta.rankName){
              const rn = meta.rankName.toLowerCase();
              for(const rk in rankMap) if(rn.includes(rk)) return rankMap[rk];
            }
          }
        }
      }
      return null; // not found
    }catch(e){
      console.warn('Tracker fetch failed for', tag, e.message);
      return null;
    }
  }

  // Build array with numeric scores
  const players = [];
  for(const p of parsed){
    let score = null;
    // If extra numeric
    if(p.extra){
      const n = parseInt(p.extra);
      if(!isNaN(n)) score = Math.min(100, Math.max(0, n));
      else {
        // try map rank name
        const lk = p.extra.toLowerCase();
        for(const rk in rankMap) if(lk.includes(rk)) { score = rankMap[rk]; break }
      }
    }
    players.push({name:p.raw, score});
  }

  // If using tracker, fetch missing scores
  if(useTracker){
    resultsEl.innerHTML = '<p class="small">Récupération des rangs via Tracker.gg…</p>';
    // Fetch in sequence to avoid rate-limits; for many players, consider batching with delays.
    for(const pl of players){
      if(pl.score == null){
        // try tag variants: if contains '#', use as-is; otherwise assume full tag provided by the user
        const tag = pl.name;
        const s = await fetchScoreFromTracker(tag);
        if(s != null) pl.score = s;
        else pl.score = 50; // default fallback
      }
    }
  } else {
    // assign default score 50 when missing
    for(const pl of players) if(pl.score==null) pl.score = 50;
  }

  // Now form teams by greedy balancing (assign next highest player to team with lowest total)
  players.sort((a,b)=>b.score - a.score);
  const teams = Array.from({length:numTeams}, ()=>({players:[], total:0}));
  for(const pl of players){
    // find team with smallest total
    teams.sort((a,b)=>a.total - b.total);
    teams[0].players.push(pl);
    teams[0].total += pl.score;
  }

  // Render results
  resultsEl.innerHTML = '';
  teams.forEach((t,i)=>{
    const div = document.createElement('div');
    div.className = 'team';
    const title = document.createElement('h3');
    title.textContent = `Équipe ${i+1} — total ${t.total}`;
    div.appendChild(title);
    t.players.forEach(p=>{
      const pdiv = document.createElement('div');
      pdiv.className = 'player';
      pdiv.innerHTML = `<span>${escapeHtml(p.name)}</span><span class="small">${p.score}</span>`;
      div.appendChild(pdiv);
    });
    resultsEl.appendChild(div);
  });

});

clearBtn.addEventListener('click', ()=>{ playersEl.value = ''; resultsEl.innerHTML = ''; });

// small helper to escape HTML
function escapeHtml(s){ return s.replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c] || c); }

// Insert a sample player list to help users
if(insertSampleBtn){
  insertSampleBtn.addEventListener('click', ()=>{
    playersEl.value = [
      'Radiant1#0001|Radiant',
      'Immortal2#0002|Immortal',
      'Alice#1234|Gold',
      'Bob#4321|Silver',
      'PlayerNoRank#5555',
      'Sub#0006|60'
    ].join('\n');
    resultsEl.innerHTML = '';
  });
}

// Clear only the players textarea (keeps other settings)
if(clearPlayersListBtn){
  clearPlayersListBtn.addEventListener('click', ()=>{
    playersEl.value = '';
    resultsEl.innerHTML = '';
  });
}
