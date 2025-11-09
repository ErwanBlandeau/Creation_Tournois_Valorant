import axios from 'axios';

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
        PLAYER_NAME = raw.split('#')[0];
        console.log(PLAYER_NAME);
		// Use a local proxy so the API key isn't exposed and CORS is handled server-side.
		// The proxy expects a `tag` query parameter with the full Riot tag like Name#1234.
		let response = await axios.get(
          `https://public-api.tracker.gg/api/v1/valorant/standard/profile/riot/${encoded}`,
          {
            headers: {
              "TRN-Api-Key":  API_KEY || '63a3ac9a-3730-4ed0-8fbb-f986e5176617',
            }
          }
        )

		try{
            if(response.status !== 200){
                showError(`Erreur lors de la récupération des données: ${response.status} ${response.statusText}`);
                return;
            }
            const data = response.data;
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

