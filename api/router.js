// src/router.js
import { AutoRouter } from 'itty-router';
import devController from './controllers/developer/handler.js';
import notifyController from './handlers/telegram.js';


const router = AutoRouter();

// dev operations
router.get('/dev', devController);

// cross-origin notify endpoint (POST)
router.post('/telegram-notify', notifyController);


router.all('*', () =>
    Response.redirect('https://jalaljaleh.github.io/', 302)
);

export default { fetch: router.fetch };