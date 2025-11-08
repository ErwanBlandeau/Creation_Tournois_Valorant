require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TRN_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Configure CORS for the frontend origin (use specific origin in production)
app.use(cors({ origin: ALLOWED_ORIGIN }));

// Simple proxy endpoint that forwards the request to tracker.gg and returns the response
app.get('/api/valorant/profile', async (req, res) => {
  const tag = req.query.tag;
  const player = req.query.player;
  if(!tag && !player) return res.status(400).json({ error: 'Missing tag or player param' });

  const identifier = tag ? tag : player;
  const encoded = encodeURIComponent(identifier);
  const url = `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${encoded}`;

  try{
    const r = await fetch(url, {
      headers: {
        'TRN-Api-Key': API_KEY || '',
        'User-Agent': 'valorant-teams-proxy/1.0',
        'Accept': 'application/json'
      }
    });

    const text = await r.text();
    const contentType = r.headers.get('content-type') || 'application/json';
    res.status(r.status).type(contentType).send(text);
  }catch(err){
    console.error('Proxy error', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
