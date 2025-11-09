document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('profile-form');
	const input = document.getElementById('player-tag');
	const out = document.getElementById('stats-output');

	function setOutput(html){ out.innerHTML = html;}

	function showError(msg){ setOutput(`<div class="error">${escapeHtml(msg)}</div>`); }

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
        const raw = (input.value||'').trim();
		if(!raw){ showError('Veuillez entrer un tag au format Nom#1234'); return; }

		setOutput('<div class="small">Chargement…</div>');
        const PLAYER_NAME = raw.split('#')[0];
        const PLAYER_TAG = raw.split('#')[1];
        console.log(PLAYER_NAME);
        console.log(PLAYER_TAG);
         
        // Encode the full tag for the API URL
        const encoded = encodeURIComponent( `${PLAYER_NAME}#${PLAYER_TAG}`);
        // Use a local proxy so the API key isn't exposed and CORS is handled server-side.
        // The proxy expects a `tag` query parameter with the full Riot tag like Name#1234.
    try{
      const url = `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${encoded}`;
      const headers = {
        "TRN-Api-Key": '5b42ea3c-b339-45ad-808c-71f8e6422de9'
      };

      const response = await fetch(url, { headers });

      if(!response.ok){
        showError(`Erreur lors de la récupération des données: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if(!data || !data.data){
        showError('Données de profil invalides reçues.');
        return;
      }
      populateProfile(data.data);
      console.log(data.data);
    }catch(err){
      showError('Erreur: ' + (err.message || String(err)));
    }
	});

});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }
// React-based static front-end. This file uses the UMD React/ReactDOM provided in index.html.
(() => {
  const e = React.createElement;

  // Configuration: use a proxy path to avoid CORS issues. If you have no proxy,
  // set PROXY_BASE to null to attempt a direct call (may be blocked by CORS).
  const PROXY_BASE = '/api/valorant/profile?tag='; // recommended
  const DIRECT_BASE = 'https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/';

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

  function ProfileView({data}){
    if(!data) return null;
    // Minimal rendering; you can expand this depending on the API shape
    return e('div', {className: 'profile'},
      e('h2', null, data.platformInfo?.platformUserHandle || 'Profil'),
      e('pre', null, JSON.stringify(data, null, 2))
    );
  }

  function App(){
    const [tag, setTag] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [profile, setProfile] = React.useState(null);

    async function submit(e){
      e && e.preventDefault();
      setError('');
      setProfile(null);
      const raw = (tag||'').trim();
      if(!raw){ setError('Veuillez entrer un tag au format Nom#1234'); return; }
      setLoading(true);
      const encoded = encodeURIComponent(raw);

      // prefer proxy to avoid CORS; if no proxy is available, try direct (may fail)
      const url = (PROXY_BASE ? PROXY_BASE + encoded : DIRECT_BASE + encoded);

      try{
        const headers = {};
        // If you call the API directly and need a key client-side (not recommended),
        // you could set headers['TRN-Api-Key'] = window.API_KEY || 'your-key';

        const resp = await fetch(url, { headers, credentials: 'omit' });
        if(!resp.ok){
          // Try to surface CORS-specific hint
          const text = await resp.text().catch(()=>null);
          throw new Error(`${resp.status} ${resp.statusText} ${text?'- '+text:''}`);
        }
        const data = await resp.json();
        if(!data || !data.data) throw new Error('Données de profil invalides reçues.');
        setProfile(data.data);
      }catch(err){
        setError('Erreur: ' + (err.message || String(err)));
      }finally{
        setLoading(false);
      }
    }

    return e('div', {className: 'container'},
      e('h1', null, 'Valorant Player Stats (React)'),
      e('form', {onSubmit: submit},
        e('input', {
          type: 'text',
          value: tag,
          onChange: (ev)=>setTag(ev.target.value),
          placeholder: 'Nom#1234',
          required: true,
          style: {marginRight: '8px'}
        }),
        e('button', {type: 'submit', disabled: loading}, loading ? 'Chargement…' : 'Get Stats')
      ),
      error && e('div', {className:'error', style:{marginTop:'10px'}}, escapeHtml(error)),
      profile && e(ProfileView, {data: profile})
    );
  }

  // mount
  const rootEl = document.getElementById('root');
  if(!rootEl){
    document.body.innerHTML = '<div style="color:red">Erreur: point de montage introuvable.</div>' + document.body.innerHTML;
  } else {
    ReactDOM.createRoot(rootEl).render(React.createElement(App));
  }
})();

