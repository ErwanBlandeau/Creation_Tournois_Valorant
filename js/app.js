document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('profile-form');
	const input = document.getElementById('player-tag');
	const out = document.getElementById('stats-output');

	function setOutput(html){ out.innerHTML = html; }

	function showError(msg){ setOutput(`<div class="error">${escapeHtml(msg)}</div>`); }

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const raw = (input.value||'').trim();
		if(!raw){ showError('Veuillez entrer un tag au format Nom#1234'); return; }

		setOutput('<div class="small">Chargement…</div>');
        PLAYER_NAME = raw.split('#')[0];
        console.log(PLAYER_NAME);
		// Determine whether user provided full tag or parts
		// If there's a '#', use it as the tag param. Otherwise try to use as player only (not ideal).
		let url = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${PLAYER_NAME}`;

		try{
			const resp = await fetch(url
                ,{
                    headers: {
                        'TRN-Api-Key': '63a3ac9a-3730-4ed0-8fbb-f986e5176617',
                    }
                }
            );
			if(!resp.ok){
				const txt = await resp.text().catch(()=>null);
				showError('Erreur proxy: ' + resp.status + ' ' + (txt||''));
				return;
			}
			const data = await resp.json();
			if(data && data.error){
				showError('API error: ' + (data.error.message || JSON.stringify(data)));
				return;
			}

			// Render useful info
			const parts = [];
			parts.push(`<div class="small">Tag: <strong>${escapeHtml(data.tag || raw)}</strong></div>`);
			if(data.cached) parts.push('<div class="small">(resultat en cache)</div>');
			parts.push(`<div class="small">Platform: ${escapeHtml(data.platform||'riot')}</div>`);
			parts.push(`<div class="small">Rank: <strong>${escapeHtml(data.rankName||'N/A')}</strong></div>`);
			parts.push(`<div class="small">Score: <strong>${data.score!=null?escapeHtml(''+data.score):'N/A'}</strong></div>`);

			// Optionally show a compact raw preview
			if(data.raw){
				try{
					const rawPretty = JSON.stringify(data.raw, null, 2).slice(0, 2000);
					parts.push('<details><summary>Détails bruts (preview)</summary><pre class="small">' + escapeHtml(rawPretty) + (JSON.stringify(data.raw).length>2000? '\n...truncated':'' )+ '</pre></details>');
				}catch(e){/* ignore */}
			}

			parts.push(`<div style="margin-top:8px"><button id="copyBtn">Copier résultat</button></div>`);

			setOutput(parts.join('\n'));

			const copyBtn = document.getElementById('copyBtn');
			if(copyBtn){
				copyBtn.addEventListener('click', ()=>{
					const text = `Tag: ${data.tag || raw}\nRank: ${data.rankName || 'N/A'}\nScore: ${data.score != null ? data.score : 'N/A'}`;
					navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : alert(text);
				});
			}

		}catch(err){
			showError('Erreur: ' + (err.message || String(err)));
		}
	});

});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

