// posts-renderer-template.js
// Fixed renderer that uses your <template id="post-template"> (single .post-body).
// Ensures Read More CTA toggles the same body block (collapsed/expanded),
// and Copy/Share buttons operate on the single .post-body text.

const API_URL = 'https://api.jalaljaleh.workers.dev/jalaljaleh/posts/get?.txt';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function getPageFromURL() {
    const u = new URL(window.location.href);
    const p = Number(u.searchParams.get('page') || '1');
    return p > 0 ? p : 1;
}
function updateURLPage(page) {
    const u = new URL(window.location.href);
    u.searchParams.set('page', page);
    history.replaceState({}, '', u.toString());
}

export function formatDate(sqlDateTime) {
    if (!sqlDateTime) return '';
    const iso = sqlDateTime.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d) ? sqlDateTime : d.toLocaleString();
}

/* ---------- fetch helpers (direct + proxy fallback) ---------- */

async function tryFetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Network error: ' + res.status);
    return res.json();
}
async function fetchDirect(url) { return tryFetchJson(url, { method: 'GET', cache: 'no-store' }); }
async function fetchViaProxy(url) {
    const proxied = CORS_PROXY + encodeURIComponent(url);
    const resText = await (await fetch(proxied, { method: 'GET', cache: 'no-store' })).text();
    return JSON.parse(resText);
}
async function fetchWithFallback(url) {
    try { return await fetchDirect(url); }
    catch (err) {
        console.warn('Direct fetch failed, trying proxy:', err && err.message ? err.message : err);
        try { return await fetchViaProxy(url); }
        catch (err2) { console.error('Proxy fetch failed:', err2 && err2.message ? err2.message : err2); throw err2; }
    }
}

/* ---------- create node from template (single .post-body) ---------- */

function createRowFromTemplate(post) {
    const tpl = document.getElementById('post-template');
    if (!tpl) throw new Error('#post-template not found');
    const node = tpl.content.firstElementChild.cloneNode(true);

    // set dataset and id anchor for linking
    node.dataset.id = post.id ?? '';
    if (post.id !== undefined && post.id !== null) node.id = 'post-' + String(post.id);

    // bind meta
    const idEl = node.querySelector('.post-id');
    const dateEl = node.querySelector('.post-date');
    if (idEl) idEl.textContent = '#' + (post.id ?? '');
    if (dateEl) dateEl.textContent = formatDate(post.created_at);

    // single body insertion (preserve line breaks via CSS white-space: pre-wrap)
    const bodyEl = node.querySelector('.post-body');
    if (bodyEl) {
        // Use textContent to avoid XSS. If you trust HTML, sanitize before using innerHTML.
        bodyEl.textContent = String(post.body ?? '');

        // initial collapsed state: limit height so "Read More" is useful
        // set a sensible collapsed max-height (approx 4 lines). Adjust as needed.
        bodyEl.style.maxHeight = '6.8rem';
        bodyEl.style.overflow = 'hidden';
        bodyEl.style.transition = 'max-height 260ms ease';
        bodyEl.classList.remove('expanded-body');
    }

    // ensure CTA exists and has initial label
    const cta = node.querySelector('.post-cta');
    if (cta) {
        cta.textContent = 'Read More';
        cta.setAttribute('aria-pressed', 'false');
    }

    return node;
}

/* ---------- enhance rows: keyboard focus and ARIA ---------- */

function enhancePostRows() {
    document.querySelectorAll('.post-row').forEach(row => {
        if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '0');

        // ensure CTA aria and small actions aria-hidden handled by CSS; set roles if missing
        const cta = row.querySelector('.post-cta');
        if (cta && !cta.hasAttribute('aria-pressed')) cta.setAttribute('aria-pressed', 'false');

        // ensure post-body is accessible region
        const body = row.querySelector('.post-body');
        if (body && !body.hasAttribute('role')) body.setAttribute('role', 'region');
    });
}

/* ---------- delegated handlers: CTA, copy, share, keyboard ---------- */

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('.post-row');
    if (!row) return;
    const action = btn.dataset.action;

    if (action === 'read') {
        // toggle expanded state and update aria + CTA label
        const body = row.querySelector('.post-body');
        const cta = row.querySelector('.post-cta');

        const expanded = row.classList.toggle('expanded'); // toggles visual state on row
        if (body) {
            if (expanded) {
                // expand: remove max-height to show full content
                body.style.maxHeight = body.scrollHeight + 'px';
                body.classList.add('expanded-body');
            } else {
                // collapse: restore limited height
                body.style.maxHeight = '6.8rem';
                body.classList.remove('expanded-body');
            }
        }

        if (cta) {
            cta.textContent = expanded ? 'Show Less' : 'Read More';
            cta.setAttribute('aria-pressed', expanded ? 'true' : 'false');
        }

        // when expanding, ensure the CTA remains visible (optional)
        if (expanded) {
            setTimeout(() => {
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 160);
        }
        return;
    }

    if (action === 'copy') {
        const bodyText = row.querySelector('.post-body')?.textContent || '';
        const toCopy = bodyText.trim().slice(0, 400) || bodyText; // copy a preview by default
        navigator.clipboard?.writeText(toCopy).then(() => {
            const prev = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = prev, 1200);
        }).catch(() => {
            const prev = btn.textContent;
            btn.textContent = 'Failed';
            setTimeout(() => btn.textContent = prev, 1200);
        });
        return;
    }

    if (action === 'share') {
        const bodyText = row.querySelector('.post-body')?.textContent || '';
        const excerpt = bodyText.trim().slice(0, 160);
        const url = location.href.split('#')[0] + '#post-' + (row.dataset.id || '');
        if (navigator.share) {
            navigator.share({ title: excerpt.slice(0, 80), text: excerpt, url }).catch(() => { });
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(excerpt + ' ' + url)}`, '_blank');
        }
        return;
    }
});

// keyboard: toggle expand with Enter or Space when focused on row
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = document.activeElement;
    if (el && el.classList && el.classList.contains('post-row')) {
        e.preventDefault();
        // reuse the same logic as click on CTA
        const cta = el.querySelector('.post-cta');
        if (cta) cta.click();
    }
});

/* ---------- main renderer with pagination & controls ---------- */

export async function renderWeblogPosts(opts = {}) {
    const container = document.getElementById('postslist');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnRefresh = document.getElementById('btnRefresh');
    const pageInfo = document.getElementById('pageInfo');
    if (!container) return;

    const state = container._postsState || {
        page: getPageFromURL(),
        perPage: 20,
        totalPages: 0,
        total: 0,
        loading: false,
        hasData: true
    };
    container._postsState = state;
    if (typeof opts.page === 'number' && opts.page > 0) state.page = opts.page;
    if (typeof opts.perPage === 'number' && opts.perPage > 0) state.perPage = opts.perPage;

    function updateControls() {
        if (pageInfo) pageInfo.textContent = state.totalPages ? `Page ${state.page} / ${state.totalPages}` : `Page ${state.page}`;
        if (btnPrev) btnPrev.disabled = state.loading || state.page <= 1;
        if (btnNext) {
            const nextDisabledByData = !state.hasData;
            const nextDisabledByTotal = state.totalPages ? state.page >= state.totalPages : false;
            btnNext.disabled = state.loading || nextDisabledByData || nextDisabledByTotal;
        }
        if (btnRefresh) btnRefresh.disabled = state.loading;
    }

    if (btnPrev && !btnPrev._hasHandler) {
        btnPrev.addEventListener('click', () => {
            if (state.loading) return;
            if (state.page > 1) {
                state.page -= 1;
                updateURLPage(state.page);
                renderWeblogPosts({ page: state.page }).catch(() => { });
            }
        });
        btnPrev._hasHandler = true;
    }
    if (btnNext && !btnNext._hasHandler) {
        btnNext.addEventListener('click', () => {
            if (state.loading) return;
            if (!state.hasData) return;
            if (state.totalPages && state.page >= state.totalPages) return;
            state.page += 1;
            updateURLPage(state.page);
            renderWeblogPosts({ page: state.page }).catch(() => { });
        });
        btnNext._hasHandler = true;
    }
    if (btnRefresh && !btnRefresh._hasHandler) {
        btnRefresh.addEventListener('click', () => {
            if (!state.loading) renderWeblogPosts({ page: state.page }).catch(() => { });
        });
        btnRefresh._hasHandler = true;
    }

    container.innerHTML = '';
    const status = document.createElement('div');
    status.textContent = 'Loading posts…';
    status.style.color = 'var(--muted)';
    status.style.fontSize = '13px';
    container.appendChild(status);

    try {
        state.loading = true;
        updateControls();

        const url = `${API_URL}&page=${encodeURIComponent(state.page)}&per_page=${encodeURIComponent(state.perPage)}`;
        const json = await fetchWithFallback(url);
        if (!json || !json.ok) throw new Error('Bad response from API');

        state.total = json.meta?.total ?? state.total;
        state.totalPages = json.meta?.total_pages ?? state.totalPages;
        status.remove();

        const hasData = Array.isArray(json.data) && json.data.length > 0;
        state.hasData = hasData;
        if (!hasData) {
            container.appendChild(document.createTextNode('No posts found on this page.'));
            state.loading = false;
            updateControls();
            return;
        }

        // render using template cloning
        json.data.forEach(post => {
            const node = createRowFromTemplate(post);
            container.appendChild(node);
        });

        // small enhancements (focusable, aria)
        enhancePostRows();

        state.loading = false;
        updateControls();
        return json.data;
    } catch (err) {
        status.textContent = 'Failed to load posts.';
        status.style.color = 'crimson';
        state.loading = false;
        if (!container._postsState || !container._postsState.hasData) state.hasData = false;
        updateControls();
        throw err;
    }
}

/* ---------- auto-run on DOM ready ---------- */

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('postslist');
    if (el) renderWeblogPosts({ page: getPageFromURL(), perPage: 20 }).catch(err => console.error('Initial render failed:', err));
});
