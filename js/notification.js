import Cookie from './cookie.js';
import { DeviceDetector } from './deviceDetector.js';

const DEFAULT_ENDPOINT = 'https://api.jalaljaleh.workers.dev/notification';

export default class Notifier {
    constructor({ endpoint = DEFAULT_ENDPOINT } = {}) {
        this.endpoint = endpoint;
        this.cookieKey = 'vjid';
        try { Cookie.touchVisitor({ name: this.cookieKey }); } catch { }
        this.deviceDetector = new DeviceDetector();
    }

    async gatherClientInfo() {
        const s = (typeof screen !== 'undefined') ? screen : {};
        const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
        const device = await this.deviceDetector.detect();
        return {
            screen: { width: s.width || null, height: s.height || null, availWidth: s.availWidth || null, availHeight: s.availHeight || null },
            deviceMemory: (typeof navigator !== 'undefined' ? navigator.deviceMemory : null) || null,
            hardwareConcurrency: (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null) || null,
            timezone: tz,
            device, // includes model, vendor, ua, confidence
        };
    }

    getVisitor() { try { return Cookie.getVisitor(this.cookieKey); } catch { return null; } }

    async notify({ visitorId } = {}) {
        const client = await this.gatherClientInfo();
        const v = this.getVisitor();

        // safe retrieval of page URL including query params; truncated to 2000 chars
        const pageUrl = (typeof location !== 'undefined' && location && location.href)
            ? String(location.href).slice(0, 2000)
            : null;

        const payload = {
            u: visitorId || v?.id || null,
            visitor: v || null,
            device: client.device,
            uaData: client.device.ua || null,
            screen: client.screen,
            deviceMemory: client.deviceMemory,
            hardwareConcurrency: client.hardwareConcurrency,
            timezone: client.timezone,
            url: pageUrl
        };
        try {
            const res = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'omit' });
            return { status: res.status, ok: res.ok, body: await res.json().catch(() => null) };
        } catch (e) {
            return { status: 0, ok: false, error: String(e) };
        }
    }
}
