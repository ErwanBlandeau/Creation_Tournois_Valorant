// Simple proxy to forward requests to Tracker.gg and enable CORS for local development.
// Usage: set TRN_API_KEY in the environment (or create a .env file with TRN_API_KEY=your_key)

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "5b42ea3c-b339-45ad-808c-71f8e6422de9";
if(!API_KEY) console.warn('Warning: TRN_API_KEY not set. Requests to Tracker.gg may be rate-limited or fail until you set it.');

// Simple in-memory cache to reduce calls during short tests: { key: { ts, data } }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60s

function mapRankToScore(rankNameOrDisplay){
  if(!rankNameOrDisplay) return null;
  const s = rankNameOrDisplay.toString().toLowerCase();
  const rankMap = {
    'iron':10,'bronze':25,'silver':35,'gold':50,'platinum':60,'diamond':75,'ascendant':82,'immortal':92,'radiant':100
  };
  for(const k of Object.keys(rankMap)){
    if(s.includes(k)) return rankMap[k];
  }
  // try to extract numeric
  const m = s.match(/(\d{1,3})/);
  if(m) return Math.min(100, Math.max(0, parseInt(m[1],10)));
  return null;
}

app.get('/api/valorant/profile', async (req, res) => {
  const nomComplet = req.query.nom;
  const tag = nomComplet.split('#')[1];
  const nom = nomComplet.split('#')[0];
    console.log(tag);
    console.log(nom);

  if(!tag) return res.status(400).json({ error: 'Missing "tag" query parameter' });

  try{
    // Support either a full `tag` parameter (e.g. "Name#1234")
    // or separate `player` and `tag` query params (PLAYER_NAME and TAG) which will be combined. 

    
    const url = `https://public-api.tracker.gg/v1/valorant/standard/profile/${nom}%23${tag}`;
    const headers = {
        'TRN-Api-Key': API_KEY
    };

    const r = await fetch(url, { headers });
    if(!r.ok){
      const txt = await r.text().catch(()=>null);
      console.warn('Tracker.gg returned', r.status, txt && txt.slice(0,200));
      return res.status(r.status).json({ error: 'Tracker.gg error', status: r.status, body: txt });
    } else {
      console.log('Tracker.gg response:', await r.json());
    }

    const data = await r.json();

    // Try to extract a readable rank name or numeric rating from common fields
    let rankName = null;
    let score = null;
    if(data && data.data && Array.isArray(data.data.segments)){
      for(const seg of data.data.segments){
        if(seg && seg.metadata && seg.metadata.rankName){
          rankName = seg.metadata.rankName;
          score = mapRankToScore(rankName) || score;
          break;
        }
        if(seg && seg.stats){
          for(const k of Object.keys(seg.stats)){
            const v = seg.stats[k];
            const keyLower = k.toLowerCase();
            if(keyLower.includes('rank') || keyLower.includes('rating') || keyLower.includes('mmr')){
              if(v && typeof v === 'object'){
                if(v.displayValue) {
                  rankName = rankName || v.displayValue;
                  score = score || mapRankToScore(v.displayValue);
                }
                if(typeof v.value === 'number') score = score || Math.round(v.value);
              } else if(typeof v === 'number'){
                score = score || Math.round(v);
              }
            }
          }
        }
      }
    }

    // fallback: try to read a top-level metadata
    if(!rankName && data && data.data && data.data.metadata && data.data.metadata.rankName){
      rankName = data.data.metadata.rankName;
      score = score || mapRankToScore(rankName);
    }

    const result = { success: true, tag, platform, rankName: rankName || null, score: (typeof score === 'number' ? Math.min(100, Math.max(0, score)) : null), raw: data };
    cache.set(cacheKey, { ts: now, data: result });
    return res.json(result);
  } catch(err){
    console.error('Proxy error:', err && err.stack || err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Tracker.gg proxy listening on http://localhost:${port}`));
