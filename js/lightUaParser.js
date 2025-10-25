// src/js/lightUaParser.js
// Compact, dependency-free fallback parser for common phone models (best-effort).
// Returns { vendor: string|null, model: string|null, os: string|null, type: 'mobile'|'tablet'|'desktop' }
export class LightUaParser {
    constructor(ua) { this.ua = (ua || '').toLowerCase(); }

    parse() {
        const u = this.ua;
        if (!u) return { vendor: null, model: null, os: null, type: 'desktop' };

        // OS detection
        let os = null;
        if (u.includes('android')) os = 'Android';
        else if (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) os = 'iOS';
        else if (u.includes('windows phone')) os = 'Windows Phone';
        else if (u.includes('windows')) os = 'Windows';
        else if (u.includes('mac os') || u.includes('macintosh')) os = 'Mac OS';
        else if (u.includes('linux')) os = 'Linux';

        // Type detection
        const type = /mobile|iphone|android.*mobile|windows phone/.test(u) ? 'mobile' : (/tablet|ipad/.test(u) ? 'tablet' : 'desktop');

        // Very-small set of regexes for popular phone vendors/models (extendable)
        const patterns = [
            { vendor: 'Apple', re: /\b(iPhone)(?:\s?os|;)/i, model: (m) => 'iPhone' + (m[1] ? '' : '') },
            { vendor: 'Apple', re: /\b(iPad)\b/i, model: () => 'iPad' },
            { vendor: 'Samsung', re: /\b(samsung[- ]?)(sm-[a-z0-9]+)/i, model: (m) => m[2].toUpperCase().replace(/-/g, '') },
            { vendor: 'Samsung', re: /\b(samsung[- ]?)(gt-[a-z0-9]+)/i, model: (m) => m[2].toUpperCase() },
            { vendor: 'Huawei', re: /\b(huawei|honor)[- ]?([a-z0-9\-]+)/i, model: (m) => m[2] ? m[2].replace(/-/g, ' ') : null },
            { vendor: 'Xiaomi', re: /\b(xiaomi|redmi|mi)[- ]?([a-z0-9]+)/i, model: (m) => m[2] || null },
            { vendor: 'OnePlus', re: /\boneplus[- ]?([a-z0-9]+)/i, model: (m) => 'OnePlus ' + (m[1] || '') },
            { vendor: 'Google', re: /\b(pixel[- ]?)([0-9a-z]+)/i, model: (m) => 'Pixel ' + (m[2] || '') },
            // generic model capture like "sm-g973f" or "sm-g998b"
            { vendor: null, re: /\b(sm-[a-z0-9]+)\b/i, model: (m) => m[1].toUpperCase().replace(/-/g, '') }
        ];

        for (const p of patterns) {
            const m = u.match(p.re);
            if (m) {
                const model = typeof p.model === 'function' ? p.model(m) : (p.model || null);
                return { vendor: p.vendor, model: model || null, os, type };
            }
        }

        // fallback: try to extract "brand model" like "huawei mate 20" or "xiaomi mi 9"
        const brandGuess = u.match(/\b(huawei|honor|samsung|xiaomi|redmi|oneplus|pixel|google|sony|lg|motorola|lenovo)\b/i);
        const modelGuess = u.match(/\b([a-z0-9\-]{3,})\b/i);
        return { vendor: brandGuess ? brandGuess[1].replace(/\b\w/g, c => c.toUpperCase()) : null, model: modelGuess ? modelGuess[1] : null, os, type };
    }
}
