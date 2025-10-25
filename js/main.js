

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}


async function fetchRepos(username) {
    const data = await fetchJSON(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    const sorted = data.sort((a, b) => b.stargazers_count - a.stargazers_count);
    const top = sorted.slice(0, 9);
    reposWrap.innerHTML = top.map(r => `
                <div class='repo'>
                  <a href='${r.html_url}' target='_blank'>${r.name}</a>
                  <p>${r.description || ''}</p>
                  <div class='meta'><span>${r.language || ''}</span><span>⭐ ${r.stargazers_count}</span></div>
                </div>`).join('');
}

async function updateAge() {
    const DOB_ISO = '2001-07-05T16:30:00Z';
    const EL = document.getElementById('ageValue');
    if (!EL) return;

    const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.2425;
    function update() {
        const dob = new Date(DOB_ISO);
        if (isNaN(dob)) { EL.textContent = '—'; return; }
        const years = (Date.now() - dob.getTime()) / MS_PER_YEAR;
        EL.textContent = years.toFixed(11);
    }
    update();
    setInterval(update, 60);
};


(async () => {

    await updateAge();

    try { import('./notification.js').then(m => new m.default().notify()); } catch { }

    try { await fetchRepos(`jalaljaleh`); }
    catch (e) {
        reposWrap.innerHTML = `<p style='color:var(--muted)'>Failed to fetch data: ${e.message}</p>`;
    }
})();