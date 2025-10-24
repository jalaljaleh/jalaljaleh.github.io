// src/router.js
import { AutoRouter } from 'itty-router';
import healthController from './controllers/health/ping.js';
import devController from './controllers/developer/handler.js';


const router = AutoRouter();

// health
router.get('/ping', healthController);

// dev operations
router.get('/dev', devController);

router.all('*', () =>
    Response.redirect('https://jalaljaleh.github.io/', 302)
);

export default { fetch: router.fetch };