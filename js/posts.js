const API_URL = 'https://api.jalaljaleh.workers.dev/jalaljaleh/posts/get?.txt';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function getPageFromURL() {
    const u = new URL(window.location.href);
    const p = Number(u.searchParams.get("page") || "1");
    return p > 0 ? p : 1;
}

function updateURLPage(page) {
    const u = new URL(window.location.href);
    u.searchParams.set("page", page);
    history.replaceState({}, "", u.toString());
}
export function formatDate(sqlDateTime) {
    if (!sqlDateTime) return '';
    const iso = sqlDateTime.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d) ? sqlDateTime : d.toLocaleString();
}

export function createTextWithLineBreaks(text) {
    const el = document.createElement('div');
    el.style.whiteSpace = 'pre-wrap';
    el.textContent = String(text ?? '');
    return el;
}

export function renderPostRow(post) {
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
    bodyEl.className = 'post-body';

    row.appendChild(header);
    row.appendChild(bodyEl);
    return row;
}

export async function renderWeblogPosts(opts = {}) {
    const container = document.getElementById("postslist");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const btnRefresh = document.getElementById("btnRefresh");
    const pageInfo = document.getElementById("pageInfo");

    if (!container) return;

    // State (stored on DOM)
    const state = container._postsState || {
        page: getPageFromURL(),
        perPage: 20,
        totalPages: 0,
        total: 0,
        loading: false,
        hasData: true // whether the current page returned data
    };
    container._postsState = state;

    if (typeof opts.page === 'number' && opts.page > 0) state.page = opts.page;

    // UI update helper
    function updateControls() {
        // pageInfo shows page and optionally total pages
        pageInfo.textContent = state.totalPages
            ? `Page ${state.page} / ${state.totalPages}`
            : `Page ${state.page}`;

        // Prev: disabled when loading or on first page
        btnPrev.disabled = state.loading || state.page <= 1;

        // Next: enabled only when not loading AND current page has data
        // Also respect totalPages if provided by API
        const nextDisabledByData = !state.hasData; // if current page had no data, don't allow next
        const nextDisabledByTotal = state.totalPages ? state.page >= state.totalPages : false;
        btnNext.disabled = state.loading || nextDisabledByData || nextDisabledByTotal;

        btnRefresh.disabled = state.loading;
    }

    // Button handlers (only once)
    if (!btnPrev._hasHandler) {
        btnPrev.addEventListener("click", () => {
            if (state.loading) return;
            if (state.page > 1) {
                state.page -= 1;
                updateURLPage(state.page);
                renderWeblogPosts({ page: state.page }).catch(() => { });
            }
        });
        btnPrev._hasHandler = true;
    }

    if (!btnNext._hasHandler) {
        btnNext.addEventListener("click", () => {
            if (state.loading) return;
            // allow going to next only if current page had data
            if (!state.hasData) return;
            // if totalPages known, ensure we don't exceed it
            if (state.totalPages && state.page >= state.totalPages) return;
            state.page += 1;
            updateURLPage(state.page);
            renderWeblogPosts({ page: state.page }).catch(() => { });
        });
        btnNext._hasHandler = true;
    }

    if (!btnRefresh._hasHandler) {
        btnRefresh.addEventListener("click", () => {
            if (!state.loading) renderWeblogPosts({ page: state.page }).catch(() => { });
        });
        btnRefresh._hasHandler = true;
    }

    // Clear old content
    container.innerHTML = "";
    const status = document.createElement("div");
    status.textContent = "Loading posts…";
    status.style.color = "var(--muted)";
    status.style.fontSize = "13px";
    container.appendChild(status);

    try {
        state.loading = true;
        updateControls();

        const url =
            `${API_URL}&page=${encodeURIComponent(state.page)}` +
            `&per_page=${encodeURIComponent(state.perPage)}`;

        let json;
        try {
            json = await fetch(url).then(r => {
                if (!r.ok) throw new Error("CORS / network error");
                return r.json();
            });
        } catch (err) {
            json = JSON.parse(
                await fetch(CORS_PROXY + encodeURIComponent(url)).then(r => r.text())
            );
        }

        if (!json || !json.ok) throw new Error("Bad response");

        // update totals if provided
        state.total = json.meta?.total ?? state.total;
        state.totalPages = json.meta?.total_pages ?? state.totalPages;

        status.remove();

        // Determine whether this page returned data
        const hasData = Array.isArray(json.data) && json.data.length > 0;
        state.hasData = hasData;

        if (!hasData) {
            // If current page has no data:
            // - show message
            // - disable Next to prevent going further
            // - if page > 1, you may want to step back to previous page automatically or leave it to user
            container.appendChild(document.createTextNode("No posts found on this page."));
            state.loading = false;
            updateControls();
            return;
        }

        // we have data: render posts
        json.data.forEach(post => container.appendChild(renderPostRow(post)));

        state.loading = false;
        updateControls();

        return json.data;
    } catch (err) {
        status.textContent = "Failed to load posts.";
        status.style.color = "crimson";

        state.loading = false;
        // if fetch failed and there is no data, mark hasData false to prevent next navigation
        if (!container._postsState || !container._postsState.hasData) {
            state.hasData = false;
        }
        updateControls();
        throw err;
    }
}
