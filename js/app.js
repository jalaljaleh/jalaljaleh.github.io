const username = 'jalaljaleh';
const avatar = document.getElementById('avatar');
const fullName = document.getElementById('fullName');
const userHandle = document.getElementById('userHandle');
const company = document.getElementById('company');
const locationEl = document.getElementById('location');

const reposCount = document.getElementById('reposCount');
//const followers = document.getElementById('followers');
//const following = document.getElementById('following');
const bio = document.getElementById('bio');
const reposWrap = document.getElementById('reposWrap');

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

async function fetchProfile(username) {
    const data = await fetchJSON(`https://api.github.com/users/${username}`);

    avatar.src = data.avatar_url;
    fullName.textContent = (data.name || data.login) + ' | محمد جلال ژاله';
    userHandle.textContent = '@' + data.login;
    company.textContent = data.company || '';
    locationEl.textContent = data.location || '';
  
    reposCount.textContent = data.public_repos;
    //followers.textContent = data.followers;
    //following.textContent = data.following;
    bio.textContent = data.bio || '';
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
        await fetchProfile(username);
        await fetchRepos(username);
    } catch (e) {
        reposWrap.innerHTML = `<p style='color:var(--muted)'>Failed to fetch data: ${e.message}</p>`;
    }
})();