// src/js/deviceHintsDetector.js
// Uses User Agent Client Hints when available (navigator.userAgentData).
export class DeviceHintsDetector {
    // returns { hasHints: bool, model: string|null, brand: string|null, platform: string|null, mobile: bool|null, ua: string|null }
    async detect() {
        const out = { hasHints: false, model: null, brand: null, platform: null, mobile: null, ua: null };
        if (typeof navigator === 'undefined') return out;
        out.ua = navigator.userAgent || null;
        const uad = navigator.userAgentData;
        if (!uad) return out;
        out.hasHints = true;
        out.brand = (uad.brands && uad.brands.length) ? uad.brands.map(b => b.brand).join(',') : null;
        out.mobile = typeof uad.mobile === 'boolean' ? uad.mobile : null;
        try {
            const hints = await uad.getHighEntropyValues(['platform', 'model', 'uaFullVersion']).catch(() => ({}));
            out.platform = hints.platform || null;
            out.model = hints.model || null;
            // uaFullVersion may be present; keep UA as raw string
        } catch (e) {
            // ignore errors; fields remain null
        }
        return out;
    }
}
