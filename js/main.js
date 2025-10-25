

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

(async () => {

    try {
        await fetchRepos(`jalaljaleh`);
    } catch (e) {
        reposWrap.innerHTML = `<p style='color:var(--muted)'>Failed to fetch data: ${e.message}</p>`;
    }
})();