// src/js/cookie.js
const Cookie = (() => {
    const DEFAULT_TTL_DAYS = 365;

    function _isBrowser() {
        return typeof document !== 'undefined' && typeof window !== 'undefined';
    }

    function _encode(v) {
        return encodeURIComponent(v);
    }
    function _decode(v) {
        try { return decodeURIComponent(v); } catch (e) { return v; }
    }

    function _serialize(value, asJson) {
        if (value === undefined || value === null) return '';
        if (asJson && typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    function _cookieString(name, value, days, opts = {}) {
        const expires = (typeof days === 'number' && days > 0)
            ? new Date(Date.now() + days * 864e5).toUTCString()
            : undefined;
        let s = `${_encode(name)}=${_encode(value)}`;
        if (expires) s += `; Expires=${expires}`;
        s += '; Path=/';
        if (opts.domain) s += `; Domain=${opts.domain}`;
        if (opts.sameSite) s += `; SameSite=${opts.sameSite}`;
        if (opts.secure) s += '; Secure';
        return s + ';';
    }

    function set(name, value, { days = DEFAULT_TTL_DAYS, sameSite = 'Lax', secure = (typeof location !== 'undefined' && location.protocol === 'https:'), domain } = {}) {
        if (!_isBrowser()) return false;
        const raw = _serialize(value, true);
        try {
            const cookie = _cookieString(name, raw, days, { sameSite, secure, domain });
            document.cookie = cookie;
            return true;
        } catch (e) {
            console.error('Cookie.set error', e);
            return false;
        }
    }

    function get(name, { json = false } = {}) {
        if (!_isBrowser()) return null;
        const re = new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)');
        const m = document.cookie.match(re);
        if (!m) return null;
        const val = _decode(m[1]);
        if (json) {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
    }

    function has(name) {
        return get(name) !== null;
    }

    function remove(name, { domain } = {}) {
        if (!_isBrowser()) return false;
        // set expiration to past
        try {
            const cookie = _cookieString(name, '', -1, { sameSite: 'Lax', secure: false, domain });
            document.cookie = cookie;
            return true;
        } catch (e) {
            console.error('Cookie.remove error', e);
            return false;
        }
    }

    function getAll() {
        if (!_isBrowser()) return {};
        const raw = document.cookie || '';
        if (!raw) return {};
        return raw.split('; ').reduce((acc, pair) => {
            const idx = pair.indexOf('=');
            if (idx < 0) return acc;
            const k = _decode(pair.slice(0, idx));
            const v = _decode(pair.slice(idx + 1));
            acc[k] = v;
            return acc;
        }, {});
    }

    function clear(prefix = '') {
        if (!_isBrowser()) return 0;
        const all = getAll();
        let removed = 0;
        Object.keys(all).forEach(k => {
            if (!prefix || k.startsWith(prefix)) {
                if (remove(k)) removed++;
            }
        });
        return removed;
    }

    // Visitor helpers
    function _makeId(prefix = 'v', len = 10) {
        return `${prefix}-${Math.random().toString(36).slice(2, 2 + len)}`;
    }

    function touchVisitor({ name = 'vjid', days = DEFAULT_TTL_DAYS, sameSite = 'Lax', secure = (typeof location !== 'undefined' && location.protocol === 'https:'), domain } = {}) {
        const now = new Date().toISOString();
        const existing = get(name, { json: true });
        let obj;
        if (existing && existing.id) {
            obj = Object.assign({}, existing, { lastVisitUtc: now });
        } else {
            obj = { id: _makeId('visitor', 8), lastVisitUtc: now };
        }
        set(name, obj, { days, sameSite, secure, domain });
        return obj;
    }

    function getVisitor(name = 'vjid') {
        return get(name, { json: true });
    }

    return {
        set,
        get,
        has,
        remove,
        getAll,
        clear,
        touchVisitor,
        getVisitor
    };
})();

// export for ESM environments
export default Cookie;
