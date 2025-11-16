// posts-renderer.js
// Tries direct fetch, falls back to AllOrigins proxy on CORS/network failure.
// Drops posts into #postslist. Auto-runs on DOMContentLoaded if element exists.

const API_URL = 'https://api.jalaljaleh.workers.dev/jalaljaleh/posts/get?.txt';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // fallback proxy

function formatDate(sqlDateTime) {
    if (!sqlDateTime) return '';
    const iso = sqlDateTime.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d) ? sqlDateTime : d.toLocaleString();
}

function createTextWithLineBreaks(text) {
    const el = document.createElement('div');
    el.style.whiteSpace = 'pre-wrap';
    el.textContent = String(text ?? '');
    return el;
}

function createStatus(text, color = 'var(--muted)') {
    const s = document.createElement('div');
    s.textContent = text;
    s.style.color = color;
    s.style.fontSize = '13px';
    s.style.margin = '8px 0';
    return s;
}

function renderPostRow(post) {
    const row = document.createElement('div');
    row.style.direction = 'rtl';
    row.className = 'project-row';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '6px';
    

    const idEl = document.createElement('div');
    idEl.textContent = '#' + (post.id ?? '');
    idEl.style.color = 'var(--accent)';
    idEl.style.fontWeight = '700';

    const dateEl = document.createElement('div');
    dateEl.textContent = formatDate(post.created_at);
    dateEl.style.color = 'var(--muted)';
    dateEl.style.fontSize = '12px';

    header.appendChild(idEl);
    header.appendChild(dateEl);

    const bodyEl = createTextWithLineBreaks(post.body ?? '');
    bodyEl.className = 'project-description';

    row.appendChild(header);
    row.appendChild(bodyEl);

    return row;
}

async function tryFetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Network error: ' + res.status);
    return res.json();
}

async function fetchPostsDirect() {
    // Attempt a direct fetch (may fail due to CORS)
    return tryFetchJson(API_URL, { method: 'GET', cache: 'no-store' });
}

async function fetchPostsViaProxy() {
    // AllOrigins expects the target url encoded as query param
    const proxied = CORS_PROXY + encodeURIComponent(API_URL);
    // AllOrigins/raw returns raw body; JSON.parse if needed
    const resText = await (await fetch(proxied, { method: 'GET', cache: 'no-store' })).text();
    // the worker API returns JSON; parse it
    return JSON.parse(resText);
}

/**
 * Fetch posts with fallback to CORS proxy if needed.
 * Returns the parsed API response object (whole JSON).
 */
async function fetchPostsWithFallback() {
    try {
        // first try direct
        return await fetchPostsDirect();
    } catch (err) {
        // If CORS or network error, try the proxy fallback
        // Console log for debugging
        // eslint-disable-next-line no-console
        console.warn('Direct fetch failed, retrying via proxy:', err && err.message ? err.message : err);
        try {
            return await fetchPostsViaProxy();
        } catch (err2) {
            // eslint-disable-next-line no-console
            console.error('Proxy fetch failed:', err2 && err2.message ? err2.message : err2);
            throw err2;
        }
    }
}

/**
 * Renders posts into #postslist.
 * @param {Object} [opts]
 * @param {boolean} [opts.clear=true] clear the container before rendering
 * @returns {Promise<Array>} posts array
 */
export async function renderWeblogPosts(opts = {}) {
    const { clear = true } = opts;
    const container = document.getElementById('postslist');
    const centerLink = container ? container.parentElement?.querySelector('center a') : null;

    if (!container) throw new Error('#postslist element not found');

    if (clear) container.innerHTML = '';
    if (centerLink) centerLink.style.display = 'none';

    const status = createStatus('Loading posts…');
    container.appendChild(status);

    try {
        const json = await fetchPostsWithFallback();

        // json may be the API object directly, ensure shape
        if (!json || !json.ok || !Array.isArray(json.data)) {
            throw new Error('Unexpected API response');
        }

        const posts = json.data;
        status.remove();

        if (!posts.length) {
            container.appendChild(createStatus('No posts found.', 'var(--muted)'));
            if (centerLink) {
                centerLink.textContent = 'No writes';
                centerLink.href = '';
                centerLink.style.display = '';
            }
            return posts;
        }

        posts.forEach(p => container.appendChild(renderPostRow(p)));

        if (centerLink) {
            centerLink.textContent = 'View all posts';
            centerLink.href = API_URL;
            centerLink.target = '_blank';
            centerLink.rel = 'noopener';
            centerLink.style.display = '';
        }

        return posts;
    } catch (err) {
        status.remove();
        container.appendChild(createStatus('Failed to load posts.', 'crimson'));
        const errEl = document.createElement('div');
        errEl.textContent = err && err.message ? err.message : String(err);
        errEl.style.color = 'crimson';
        errEl.style.fontSize = '13px';
        errEl.style.marginTop = '6px';
        container.appendChild(errEl);
        throw err;
    }
}
