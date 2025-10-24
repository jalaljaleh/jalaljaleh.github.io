// src/controllers/developer.js
import JsonResponse from '../../utils/JsonResponse.js';

export default async function dev(request, env) {
    const url = new URL(request.url);
    const command = url.searchParams.get('command');
    const token = url.searchParams.get('token');

    if (!token || token !== env.DEVELOPER_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        return await handleCommand(command, env, request);
    } catch (err) {
        return handleError(err);
    }
}

async function handleCommand(command, env, request) {
  
    switch ((command || '').toLowerCase()) {
      
        case 'ping':
            return new JsonResponse({ result: 'pong !' }, { status: 200 });

        default:
            return UnkownCommands();
    }
}

function handleError(err) {
    return new JsonResponse({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
}

function UnkownCommands() {
    return new JsonResponse({ error: 'Unknown dev command' }, { status: 400 });
}
