// src/js/deviceDetector.js
// Combines hints and UA fallback; exposes detect() that returns comprehensive object.
// Uses DeviceHintsDetector (client hints) and LightUaParser (UA parsing).
import { DeviceHintsDetector } from './deviceHintsDetector.js';
import { LightUaParser } from './lightUaParser.js';

export class DeviceDetector {
    constructor() {
        this.hints = new DeviceHintsDetector();
    }

    // returns { source: 'hints'|'ua'|'mixed', model, vendor, platform, os, ua, mobile, confidence }
    async detect() {
        const hint = await this.hints.detect();
        const ua = hint.ua || (typeof navigator !== 'undefined' ? (navigator.userAgent || null) : null);
        const parsed = new LightUaParser(ua).parse();

        // Prefer hint.model when present; otherwise parsed.model
        const model = hint.model || parsed.model || null;
        const vendor = hint.brand || parsed.vendor || null;
        const platform = hint.platform || parsed.os || null;
        const mobile = (typeof hint.mobile === 'boolean') ? hint.mobile : (parsed.type === 'mobile');

        let source = 'ua';
        if (hint.hasHints && hint.model) source = 'hints';
        else if (hint.hasHints) source = 'mixed';

        // simple confidence heuristic
        const confidence = hint.model ? 0.95 : (parsed.model ? 0.65 : 0.4);

        return {
            source,
            model,
            vendor,
            platform,
            os: parsed.os || hint.platform || null,
            ua,
            mobile,
            confidence
        };
    }
}
