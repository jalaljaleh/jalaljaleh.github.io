// src/js/notifier.js
const DEFAULT_ENDPOINT = 'https://api.jalaljaleh.workers.dev/notification';

export default class Notifier {
    constructor({ endpoint = DEFAULT_ENDPOINT, sharedToken = '' } = {}) {
        this.endpoint = endpoint;
        this.sharedToken = sharedToken;
        this.cookieKey = 'vjid';
    }

    // cookie helpers
    setCookie(name, value, days = 365, opts = {}) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Expires=${expires}; Path=/;`;
        if (opts.sameSite) cookie += ` SameSite=${opts.sameSite};`;
        if (opts.secure) cookie += ' Secure;';
        if (opts.domain) cookie += ` Domain=${opts.domain};`;
        document.cookie = cookie;
    }

    getCookie(name) {
        const re = new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)');
        const m = document.cookie.match(re);
        return m ? decodeURIComponent(m[1]) : null;
    }

    generateVisitorId(prefix = 'visitor', len = 8) {
        return `${prefix}-${Math.random().toString(36).slice(2, 2 + len)}`;
    }

    getPersistentVisitorId() {
        let id = this.getCookie(this.cookieKey);
        if (id) return id;
        try {
            id = localStorage.getItem(this.cookieKey);
            if (id) {
                try { this.setCookie(this.cookieKey, id, 365, { sameSite: 'Lax', secure: location.protocol === 'https:' }); } catch (e) { }
                return id;
            }
        } catch (e) { }
        id = this.generateVisitorId('visitor', 8);
        try { this.setCookie(this.cookieKey, id, 365, { sameSite: 'Lax', secure: location.protocol === 'https:' }); } catch (e) { }
        try { localStorage.setItem(this.cookieKey, id); } catch (e) { }
        return id;
    }

    async gatherClientInfo() {
        const screenInfo = {
            width: (typeof screen !== 'undefined' && screen.width) ? screen.width : null,
            height: (typeof screen !== 'undefined' && screen.height) ? screen.height : null,
            availWidth: (typeof screen !== 'undefined' && screen.availWidth) ? screen.availWidth : null,
            availHeight: (typeof screen !== 'undefined' && screen.availHeight) ? screen.availHeight : null
        };
        const deviceMemory = (navigator && navigator.deviceMemory) ? navigator.deviceMemory : null;
        const hardwareConcurrency = (navigator && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null;
        const timezone = (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

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

    async notify(visitorId = undefined) {
        try {
            const client = await this.gatherClientInfo();
            const payload = {
                u: visitorId || this.getPersistentVisitorId(),
                uaData: client.uaData,
                screen: client.screen,
                deviceMemory: client.deviceMemory,
                hardwareConcurrency: client.hardwareConcurrency,
                timezone: client.timezone
            };
            const headers = { 'Content-Type': 'application/json' };
            if (this.sharedToken) headers['X-NOTIFY-TOKEN'] = this.sharedToken;
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                credentials: 'omit'
            });
            const j = await res.json().catch(() => null);
            return { status: res.status, ok: res.ok, body: j };
        } catch (err) {
            console.error('Notifier.notify error', err);
            return { status: 0, ok: false, error: String(err) };
        }
    }
}
