// src/js/notifier.js
import Cookie from './cookie.js';

// default endpoint
const DEFAULT_ENDPOINT = 'https://api.jalaljaleh.workers.dev/notification';

export default class Notifier {
    constructor({ endpoint = DEFAULT_ENDPOINT, cookieKey = 'vjid' } = {}) {
        this.endpoint = endpoint;
        this.cookieKey = cookieKey;
        try { Cookie.touchVisitor({ name: this.cookieKey }); } catch (e) { }
    }

    async collect() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const s = typeof screen !== 'undefined' ? screen : {};
        const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

        const ua = nav.userAgent || null;
        // try to collect userAgentData (client hints)
        let uaData = null;
        try {
            const uad = nav.userAgentData;
            if (uad) {
                uaData = {
                    brands: (uad.brands || uad.uaList || (uad.brands ? uad.brands.map(b => b.brand) : null)),
                    mobile: typeof uad.mobile === 'boolean' ? uad.mobile : null,
                    // request high-entropy values if supported
                    highEntropy: await (uad.getHighEntropyValues ? uad.getHighEntropyValues(['platform', 'model', 'uaFullVersion', 'platformVersion', 'architecture', 'fullVersionList']).catch(() => ({})) : Promise.resolve({}))
                };
            }
        } catch (e) { uaData = null; }

        // battery (best-effort)
        let battery = null;
        try {
            if (navigator && navigator.getBattery) {
                const batt = await navigator.getBattery();
                battery = {
                    charging: batt.charging,
                    level: batt.level,
                    chargingTime: batt.chargingTime,
                    dischargingTime: batt.dischargingTime
                };
            }
        } catch (e) { battery = null; }

        // media devices (best-effort, labels may be withheld without permission)
        let mediaDevices = null;
        try {
            if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devs = await navigator.mediaDevices.enumerateDevices().catch(() => []);
                mediaDevices = devs.map(d => ({ kind: d.kind, label: d.label || null, deviceId: d.deviceId || null }));
            }
        } catch (e) { mediaDevices = null; }

        // connection info
        const connection = (navigator && (navigator.connection || navigator.mozConnection || navigator.webkitConnection)) || null;

        // canvas fingerprint (deterministic, quick)
        const canvasHash = await computeCanvasFingerprint();

        // performance timing snapshot (navigation timing)
        const performanceSnapshot = collectPerformance();

        // get languages
        const languages = navigator.languages || [navigator.language].filter(Boolean);

        // screen / display
        const screenObj = {
            width: (s && s.width) || null,
            height: (s && s.height) || null,
            availWidth: (s && s.availWidth) || null,
            availHeight: (s && s.availHeight) || null,
            colorDepth: (s && s.colorDepth) || null,
            pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1
        };

        // visitor cookie
        const visitor = Cookie.getVisitor(this.cookieKey);

        return {
            ua,
            uaData,
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
        try {
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'omit'
            });
            return await res.json().catch(() => ({ ok: false }));
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}

// Helpers used above

function collectPerformance() {
    try {
        if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
        const nav = performance.getEntriesByType('navigation')[0] || null;
        if (!nav) return null;
        return {
            domContentLoaded: nav.domContentLoadedEventEnd,
            loadEvent: nav.loadEventEnd,
            transferSize: nav.transferSize || null,
            encodedBodySize: nav.encodedBodySize || null
        };
    } catch (e) { return null; }
}

async function computeCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 50;
        const ctx = canvas.getContext('2d');
        // draw text with particular fonts
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Fingerprint-Example-® 0123456789', 2, 2);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('«∆—≈»', 2, 20);
        // get data
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        // simple hash: return base64 of a Uint8Array digest
        const buffer = new Uint8Array(data).buffer;
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        const hashArr = new Uint8Array(digest);
        return Array.from(hashArr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return null;
    }
}
