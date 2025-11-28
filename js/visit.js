// src/js/notifier.js
import Cookie from './cookie.js';

const DEFAULT_ENDPOINT = 'https://api.jalaljaleh.workers.dev/visit';

export default class Notifier {
    constructor({ endpoint = DEFAULT_ENDPOINT, cookieKey = 'vjid', token = null } = {}) {
        this.endpoint = endpoint;
        this.cookieKey = cookieKey;
        this.token = token;
        try { Cookie.touchVisitor({ name: this.cookieKey }); } catch (e) { /* ignore */ }
    }

    // Collect only the minimal fields requested
    async collectMinimal() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const s = typeof screen !== 'undefined' ? screen : {};
        const ua = nav.userAgent || null;

        // try to get high-entropy model if available
        let secCHModel = null;
        let uaDataBrands = null;
        let uaMobile = null;
        try {
            const uad = nav.userAgentData;
            if (uad) {
                uaDataBrands = uad.brands || uad.uaList || null;
                uaMobile = typeof uad.mobile === 'boolean' ? uad.mobile : null;
                if (uad.getHighEntropyValues) {
                    const hv = await uad.getHighEntropyValues(['model']).catch(() => ({}));
                    if (hv && hv.model) secCHModel = hv.model;
                }
            }
        } catch (e) {
            secCHModel = null;
            uaDataBrands = null;
            uaMobile = null;
        }

        const connection = (nav && (nav.connection || nav.mozConnection || nav.webkitConnection)) || null;

        const visitor = Cookie.getVisitor(this.cookieKey);

        return {
            Time: new Date().toISOString(),
            IP: null, // browser cannot reliably provide IP; server can enrich this
            Location: null, // server-side geolocation recommended
            Device: secCHModel || null,
            Vendor: (() => {
                const model = secCHModel || '';
                if (!model) return null;
                const parts = String(model).split(/[\s-_]/).filter(Boolean);
                return parts.length ? parts[0] : null;
            })(),
            Model: secCHModel || null,
            Type: (uaMobile === true) ? 'Mobile' : (uaMobile === false ? 'Desktop' : (/\bMobile\b/i.test(ua || '') ? 'Mobile' : 'Desktop')),
            OS: nav.platform || null,
            Browser: (() => {
                if (Array.isArray(uaDataBrands) && uaDataBrands.length) {
                    const b = uaDataBrands[0];
                    return (typeof b === 'string') ? b : (b && b.brand) ? b.brand : (ua || null);
                }
                return ua || null;
            })(),
            Screen: (s && typeof s.width === 'number' && typeof s.height === 'number') ? `width:${s.width},height:${s.height}` : null,
            Memory: (typeof nav.deviceMemory === 'number') ? nav.deviceMemory : null,
            "CPU Cores": (typeof nav.hardwareConcurrency === 'number') ? nav.hardwareConcurrency : null,
            Connection: connection && connection.effectiveType ? connection.effectiveType : null,
            URL: (typeof location !== 'undefined' && location.href) ? String(location.href) : null,
            "Visitor Cookie": visitor || null
        };
    }

    // Send the minimal payload to the endpoint
    async sendMinimal({ visitorId } = {}) {
        const payload = await this.collectMinimal();
        if (visitorId) payload.visitorId = visitorId;

        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['X-NOTIFY-TOKEN'] = this.token;

        try {
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                credentials: 'omit',
                mode: 'cors'
            });
            return await res.json().catch(() => ({ ok: res.ok, status: res.status }));
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}
