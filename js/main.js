// helper
async function fetchJSON(url) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
}

async function fetchRepos(username) {
    const perPage = 100;
    const reposWrap = document.getElementById('reposWrap');
    const reposCountEl = document.getElementById('reposCount');
    const reposLoaded = document.getElementById('reposLoaded');
    const chips = Array.from(document.querySelectorAll('.chip'));
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    let allRepos = [];
    let filtered = [];
    let page = 1;
    const pageSize = 9;

    function escapeHTML(str) {
        return String(str || '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[s]));
    }

    function buildTable(items) {
        // table header (matches repo-view.css expectations)
        return `
      <div class="repo-table-container" style="overflow:auto;">
        <table class="repo-table" role="table" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th>Name</th>
              <th style=" min-width: 200px; width:40%;">Description</th>
              <th>Language</th>
              <th>Stars</th>
              <th>Updated</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(r => {
            const name = escapeHTML(r.name);
            const url = r.html_url;
            const desc = r.description ? escapeHTML(r.description) : '';
            const lang = r.language ? escapeHTML(r.language) : '';
            const stars = r.stargazers_count || 0;
            const pushed = r.pushed_at ? new Date(r.pushed_at).toLocaleDateString() : '';
            const type = r.fork ? 'Fork' : 'Source';
            return `
                <tr data-lang="${lang}">
                  <td><a class="repo-name" href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></td>
                  <td class="repo-desc">${desc}</td>
                  <td>${lang ? `<span class="lang">${lang}</span>` : ''}</td>
                  <td class="stars">${stars}</td>
                  <td>${pushed}</td>
                  <td><span class="badge">${type}</span></td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    function renderPage() {
        const total = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.min(Math.max(1, page), total);
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        reposWrap.innerHTML = buildTable(items);

        if (reposCountEl) reposCountEl.textContent = allRepos.length;
        if (reposLoaded) reposLoaded.textContent = `${filtered.length} shown • ${allRepos.length} total`;
        if (pageInfo) pageInfo.textContent = `${page} / ${total}`;
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= total;
    }

    function applyFilters() {
        const activeLang = document.querySelector('.chip.active')?.dataset.lang || 'all';
        filtered = allRepos.filter(r => {
            const matchesLang = activeLang === 'all' || (r.language && r.language === activeLang);
            return matchesLang;
        });
        page = 1;
        renderPage();
    }

    // wire chips and pagination
    chips.forEach(ch => ch.addEventListener('click', e => {
        chips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        applyFilters();
    }));
    if (prevBtn) prevBtn.addEventListener('click', () => { page = Math.max(1, page - 1); renderPage(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { page = page + 1; renderPage(); });

    try {
        if (reposLoaded) reposLoaded.textContent = 'Loading repositories...';
        const data = await fetchJSON(`https://api.github.com/users/${username}/repos?per_page=${perPage}&sort=updated`);
        allRepos = Array.isArray(data) ? data : [];
        allRepos.forEach(r => {
            r.stargazers_count = r.stargazers_count || 0;
            r.language = r.language || '';
        });
        applyFilters();
    } catch (err) {
        reposWrap.innerHTML = `<div class="repo"><p style="color:var(--muted)">Failed to load repositories. ${escapeHTML(err.message)}</p></div>`;
        if (reposLoaded) reposLoaded.textContent = 'Failed to load';
        if (reposCountEl) reposCountEl.textContent = '0';
    }
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