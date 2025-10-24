// src/router.js
import { AutoRouter } from 'itty-router';
import devController from './controllers/developer/handler.js';
import notifyController from './handlers/telegram.js';


const router = AutoRouter();

// dev operations
router.get('/dev', devController);


// cross-origin notify endpoint (POST)
router.get('/telegram-notify', notifyController);

//router.all('*', () =>
//    Response.redirect('https://jalaljaleh.github.io/', 302)
//);


router.all('*', (request, env, ctx) => {
    return new Response(JSON.stringify({ ok: false, error: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
});

export default { fetch: router.fetch };