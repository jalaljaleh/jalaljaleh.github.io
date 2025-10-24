// src/router.js
import { AutoRouter } from 'itty-router';
import devController from './controllers/developer/handler.js';


const router = AutoRouter();

// dev operations
router.get('/dev', devController);

router.all('*', () =>
    Response.redirect('https://jalaljaleh.github.io/', 302)
);

export default { fetch: router.fetch };