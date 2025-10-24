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
    fullName.textContent = (data.name || data.login) ;
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


        // CONFIG
        const ENDPOINT = 'https://api.jalaljaleh.workers.dev/notification';
        // If your Worker requires a shared token, set it here.
        // Do NOT embed a secret for public sites; use a proxy or server-side flow instead.
        const SHARED_TOKEN = ''; // e.g. 'sh_xxx' or '' to skip

        // Collect optional client-side-only fields safely
        async function gatherClientInfo() {
            const screenInfo = {
                width: (typeof screen !== 'undefined' && screen.width) ? screen.width : null,
                height: (typeof screen !== 'undefined' && screen.height) ? screen.height : null,
                availWidth: (typeof screen !== 'undefined' && screen.availWidth) ? screen.availWidth : null,
                availHeight: (typeof screen !== 'undefined' && screen.availHeight) ? screen.availHeight : null
            };

            const deviceMemory = (navigator && navigator.deviceMemory) ? navigator.deviceMemory : null;
            const hardwareConcurrency = (navigator && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null;
            const timezone = (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

            // User Agent Client Hints (best-effort)
            let uaData = null;
            try {
                if (navigator && navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
                    const values = await navigator.userAgentData.getHighEntropyValues(['platform', 'model', 'uaFullVersion']);
                    uaData = {
                        brands: navigator.userAgentData.brands || null,
                        mobile: navigator.userAgentData.mobile || null,
                        platform: values.platform || null,
                        model: values.model || null,
                        ua: navigator.userAgent || null
                    };
                } else {
                    uaData = { ua: navigator.userAgent || null };
                }
            } catch (e) {
                uaData = { ua: navigator.userAgent || null };
            }

            return { screen: screenInfo, deviceMemory, hardwareConcurrency, timezone, uaData };
        }

        // Call endpoint with optional visitor id
        async function notifyServer(visitorId = undefined) {
            try {
                const client = await gatherClientInfo();
                const payload = {
                    u: visitorId,           // optional caller-provided id for dedupe
                    uaData: client.uaData,  // optional
                    screen: client.screen,  // optional
                    deviceMemory: client.deviceMemory, // optional
                    hardwareConcurrency: client.hardwareConcurrency, // optional
                    timezone: client.timezone // optional
                };

                const headers = { 'Content-Type': 'application/json' };
                if (SHARED_TOKEN) headers['X-NOTIFY-TOKEN'] = SHARED_TOKEN;

                const res = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    credentials: 'omit',
                });

                const j = await res.json().catch(() => null);
                console.log('notify response', res.status, j);
                if (!res.ok) {
                    alert('Notify failed: ' + (j && j.error ? j.error : res.status));
                } else {
                    alert('Notify OK: ' + JSON.stringify(j));
                }
            } catch (err) {
                console.error('notify error', err);
                alert('Notify error: ' + err.message);
            }
        }

        document.getElementById('notifyBtn').addEventListener('click', () => {
            // optionally generate a short visitor id for better dedupe (local random or user id)
            const visitorId = 'visitor-' + Math.random().toString(36).slice(2, 10);
            notifyServer(visitorId);
        });


    } catch { }


    try {
        await fetchProfile(username);
        await fetchRepos(username);
    } catch (e) {
        reposWrap.innerHTML = `<p style='color:var(--muted)'>Failed to fetch data: ${e.message}</p>`;
    }
})();