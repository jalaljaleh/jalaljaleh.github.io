// src/controllers/notify/handler.js
// Expects bindings:
//   - env.TELEGRAM_BOT_TOKEN (secret)
//   - env.OWNER_CHAT_ID (secret)
//   - env.NOTIFY_SHARED_TOKEN (optional secret for caller auth)
//   - env.VISIT_KV (KV binding)  <-- optional but recommended
//
// Behavior:
//   - POST /notify  with optional JSON { u: "<visitor-id>" }
//   - Optional shared token header: X-NOTIFY-TOKEN
//   - Uses KV to deduplicate visitors for a TTL
//   - Sends Telegram message via bot, and returns JSON (CORS headers added by router if needed)

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const VISIT_TTL_SEC = 60 * 60 * 24; // 24h
const CORS_ALLOW_ORIGIN = '*'; // change to specific origin in production
const CORS_ALLOW_HEADERS = 'Content-Type, X-NOTIFY-TOKEN';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
            'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
        },
    });
}

function mdEscape(s = '') {
    return String(s).replace(/([_*

        \[\]

            ()~`>#+\-=|{}.!\\]

)/g, '\\$1');
}

function getBotToken(env) {
  return (env && env.TELEGRAM_BOT_TOKEN) || (typeof TELEGRAM_BOT_TOKEN !== 'undefined' && TELEGRAM_BOT_TOKEN) || '';
}
function getOwnerChat(env) {
  return (env && env.OWNER_CHAT_ID) || (typeof OWNER_CHAT_ID !== 'undefined' && OWNER_CHAT_ID) || '';
}
function getSharedToken(env) {
  return (env && env.NOTIFY_SHARED_TOKEN) || (typeof NOTIFY_SHARED_TOKEN !== 'undefined' && NOTIFY_SHARED_TOKEN) || '';
}
function getKV(env) {
  return env && env.VISIT_KV ? env.VISIT_KV : null;
}

async function tgSendMessage(env, chat_id, text) {
  const token = getBotToken(env);
  if (!token) throw new Error('Bot token not configured');
  const url = `${ TELEGRAM_API_BASE } / bot${ token } / sendMessage`;
  const body = { chat_id, text, parse_mode: 'MarkdownV2', disable_web_page_preview: true };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => null);
  if (!j || j.ok === false) {
    throw new Error((j && j.description) ? j.description : `tg error ${ res.status }`);
  }
  return j.result;
}

function getClientIp(request) {
  const hv = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
  if (hv) return hv.split(',')[0].trim();
  return 'unknown';
}

async function computeVisitorKey(request) {
  // prefer caller-provided id in JSON body
  try {
    const body = await request.json().catch(() => null);
    if (body && body.u) return `u: ${ String(body.u).slice(0, 256)
} `;
  } catch {}
  // fallback: ip + ua
  const ip = getClientIp(request);
  const ua = (request.headers.get('user-agent') || '').slice(0,200);
  return `ip:${ ip }| ua:${ ua } `;
}

export default async function notifyController(request, env, ctx) {
  // handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!['POST', 'GET'].includes(request.method)) {
    return jsonResponse({ ok: false, error: 'method not allowed' }, 405);
  }

  // optional shared token auth
  const shared = getSharedToken(env);
  if (shared) {
    const token = (request.headers.get('x-notify-token') || '');
    if (token !== shared) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  const vkey = await computeVisitorKey(request);

  // dedupe via KV if available
  const kv = getKV(env);
  if (kv) {
    const seen = await kv.get(vkey);
    if (seen) return jsonResponse({ ok: true, skipped: true, reason: 'already-notified' });
    // optimistic put via waitUntil so response is fast
    ctx.waitUntil(kv.put(vkey, String(Date.now()), { expirationTtl: VISIT_TTL_SEC }));
  }

  // build message
  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '-';
  const lang = request.headers.get('accept-language') || '-';
  const referer = request.headers.get('referer') || '-';
  const url = request.url;
  const time = new Date().toISOString();

  const parts = [
    `* Visitor Notification * `,
    `* Time:* ${ mdEscape(time) } `,
    `* IP:* \`${mdEscape(ip)}\``,
    `*URL:* ${mdEscape(url)}`,
    `*UA:* ${mdEscape(String(ua)).slice(0, 300)}`,
    `*Lang:* ${mdEscape(lang)}`,
    `*Referer:* ${mdEscape(referer)}`
  ];
const message = parts.join('\n');

// send message asynchronously
ctx.waitUntil(
    tgSendMessage(env, getOwnerChat(env), message).catch(err => {
        console.error('tg send failed', err);
    })
);

return jsonResponse({ ok: true, notified: true, ttl: VISIT_TTL_SEC });
}
