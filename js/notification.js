// src/js/notifier.js
import Cookie from './cookie.js';

const DEFAULT_ENDPOINT = 'https://api.jalaljaleh.workers.dev/notification';

export default class Notifier {
    constructor({ endpoint = DEFAULT_ENDPOINT, cookieKey = 'vjid', token = null } = {}) {
        this.endpoint = endpoint;
        this.cookieKey = cookieKey;
        this.token = token;
        try { Cookie.touchVisitor({ name: this.cookieKey }); } catch (e) { }
    }

    async collect() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const s = typeof screen !== 'undefined' ? screen : {};
        const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
        const ua = nav.userAgent || null;

        // Acquire client hints (high-entropy) if available
        let uaData = null;
        let secCHModel = null;
        try {
            const uad = nav.userAgentData;
            if (uad) {
                const brands = uad.brands || uad.uaList || (uad.brands ? uad.brands.map(b => b.brand) : null);
                let highEntropy = {};
                if (uad.getHighEntropyValues) {
                    highEntropy = await uad.getHighEntropyValues([
                        'platform', 'model', 'uaFullVersion', 'platformVersion', 'architecture', 'fullVersionList'
                    ]).catch(() => ({}));
                }
                if (highEntropy && highEntropy.model) secCHModel = highEntropy.model;
                uaData = { brands, mobile: typeof uad.mobile === 'boolean' ? uad.mobile : null, highEntropy };
            }
        } catch (e) { uaData = null; secCHModel = null; }

        // platform hint
        const platform = nav.platform || (uaData && uaData.highEntropy && uaData.highEntropy.platform) || null;

        // battery (best-effort)
        let battery = null;
        try {
            if (navigator && navigator.getBattery) {
                const batt = await navigator.getBattery();
                battery = {
                    charging: batt.charging,
                    level: typeof batt.level === 'number' ? Math.round(batt.level * 100) : null,
                    chargingTime: batt.chargingTime,
                    dischargingTime: batt.dischargingTime
                };
            }
        } catch (e) { battery = null; }

        // media devices (best-effort)
        let mediaDevices = null;
        try {
            if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devs = await navigator.mediaDevices.enumerateDevices().catch(() => []);
                mediaDevices = devs.map(d => ({ kind: d.kind, label: d.label || null, deviceId: d.deviceId || null }));
            }
        } catch (e) { mediaDevices = null; }

        // connection info
        const connection = (navigator && (navigator.connection || navigator.mozConnection || navigator.webkitConnection)) || null;

        // canvas fingerprint
        const canvasHash = await computeCanvasFingerprint();

        // performance timing
        const performanceSnapshot = collectPerformance();

        // languages
        const languages = navigator.languages || ([navigator.language].filter(Boolean));

        // screen
        const screenObj = {
            width: (s && s.width) || null,
            height: (s && s.height) || null,
            availWidth: (s && s.availWidth) || null,
            availHeight: (s && s.availHeight) || null,
            colorDepth: (s && s.colorDepth) || null,
            pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1
        };

        const visitor = Cookie.getVisitor(this.cookieKey);

        return {
            ua,
            uaData,
            secCHModel,      // explicit high-entropy model if available
            platform,
            screen: screenObj,
            pixelRatio: screenObj.pixelRatio,
            colorDepth: screenObj.colorDepth,
            deviceMemory: navigator.deviceMemory || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            touchPoints: navigator.maxTouchPoints || null,
            languages,
            timezone: tz,
            battery,
            mediaDevices,
            canvasHash,
            connection: connection ? {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            } : null,
            performance: performanceSnapshot,
            visitor,
            url: (typeof location !== 'undefined' && location.href) ? String(location.href).slice(0, 2000) : null
        };
    }

    async send({ visitorId } = {}) {
        const payload = await this.collect();
        if (visitorId) payload.u = visitorId;

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
            // server intentionally returns 404 body; attempt to parse JSON if provided
            return await res.json().catch(() => ({ ok: res.ok, status: res.status }));
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}

/* helpers */

function collectPerformance() {
    try {
        if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
        const nav = performance.getEntriesByType('navigation')[0] || null;
        if (!nav) return null;
        return {
            domContentLoaded: nav.domContentLoadedEventEnd || null,
            loadEvent: nav.loadEventEnd || null,
            transferSize: nav.transferSize || null,
            encodedBodySize: nav.encodedBodySize || null
        };
    } catch (e) { return null; }
}

async function computeCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 240; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#069';
        ctx.fillText('Fingerprint Example ® 0123456789', 2, 2);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('«∆—≈»', 2, 26);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const buffer = new Uint8Array(data).buffer;
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        const hashArr = new Uint8Array(digest);
        return Array.from(hashArr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return null;
    }
}
