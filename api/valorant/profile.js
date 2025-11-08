// Vercel Serverless Function: /api/valorant/profile
// For usage on Vercel, set the environment variable TRN_API_KEY in Project Settings.
// Supports: ?tag=Name%231234  OR  ?player=Name&tag=1234

const CACHE_TTL_MS = 60 * 1000; // 60 seconds (ephemeral in serverless)
const cache = new Map();

function mapRankToScore(rankNameOrDisplay){
  if(!rankNameOrDisplay) return null;
  const s = rankNameOrDisplay.toString().toLowerCase();
  const rankMap = {
    'iron':10,'bronze':25,'silver':35,'gold':50,'platinum':60,'diamond':75,'ascendant':82,'immortal':92,'radiant':100
  };
  for(const k of Object.keys(rankMap)) if(s.includes(k)) return rankMap[k];
  const m = s.match(/(\d{1,3})/);
  if(m) return Math.min(100, Math.max(0, parseInt(m[1],10)));
  return null;
}

module.exports = async (req, res) => {
  // Basic CORS handling (allow the request origin or *). When used under same Vercel domain this isn't required,
  // but allowing origin here prevents client-side CORS errors if the frontend is hosted on the same project.
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if(req.method === 'OPTIONS') return res.status(204).end();

  const { tag } = req.query || {};
  const platform = (req.query.platform || 'riot').toString();

  // Compose tag: either ?tag=Name%231234  OR  ?player=Name&tag=1234
  let composed = (tag || '').toString();
  if(req.query.player){
    const playerName = req.query.player.toString();
    const tagPart = (req.query.tag || '').toString();
    composed = `${playerName}#${tagPart}`;
  }

  if(!composed){
    return res.status(400).json({ error: 'Missing tag or player/tag query parameter' });
  }

  const cacheKey = `${platform}:${composed}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if(cached && (now - cached.ts) < CACHE_TTL_MS){
    return res.json({ cached: true, ...cached.data });
  }

  try{
    const encoded = encodeURIComponent(composed);
    // Use v2 endpoint by default; change to /api/v1/... if you prefer v1
    const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/${platform}/${encoded}`;

    const headers = {
        'TRN-Api-Key': '5b42ea3c-b339-45ad-808c-71f8e6422de9',
        'Accept': 'application/json'

    };

    const r = await fetch(url, { headers });
    if(!r.ok){
      const txt = await r.text().catch(()=>null);
      return res.status(r.status).json({ error: 'Tracker.gg error', status: r.status, body: txt });
    }

    const data = await r.json();

    // extract readable rankName / numeric score
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

    if(!rankName && data && data.data && data.data.metadata && data.data.metadata.rankName){
      rankName = data.data.metadata.rankName;
      score = score || mapRankToScore(rankName);
    }

    const result = {
      success: true,
      tag: composed,
      platform,
      rankName: rankName || null,
      score: (typeof score === 'number' ? Math.min(100, Math.max(0, score)) : null),
      raw: data
    };

    cache.set(cacheKey, { ts: now, data: result });
    return res.json(result);
  } catch(err){
    return res.status(500).json({ error: err.message || String(err) });
  }
};
