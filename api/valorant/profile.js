// Vercel Serverless Function: /api/valorant/profile?tag=Name%231234
// This proxies the request to tracker.gg and adds the TRN API key server-side.

export default async function handler(req, res) {
  const tag = req.query.tag || (req.url && new URL(req.url, 'http://localhost').searchParams.get('tag'));
  if(!tag){
    return res.status(400).json({ error: 'missing tag query parameter' });
  }

  const API_KEY = process.env.TRN_API_KEY;

  try{
    const encoded = encodeURIComponent(tag);
    const url = `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${encoded}`;

    console.log('Proxying request for tag:', tag);
    console.log('Request URL:', url);
    // Use the fetch available in the Vercel runtime (Node 18+ supports global fetch)
    const resp = await fetch(url, {
      headers: {
        'TRN-Api-Key': "5b42ea3c-b339-45ad-808c-71f8e6422de9",
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', resp.status);
    
    const text = await resp.text();
    let body = text;
    try{ body = JSON.parse(text); } catch(e){ /* not JSON, forward as text */ }

    res.status(resp.status).json(body);
  }catch(err){
    console.error('Proxy error', err);
    res.status(500).json({ error: 'proxy_error', message: err.message });
  }
}
