//api/app.js
import router from './router.js';

export default {
    async fetch(request, env, ctx) {
        // allow router to handle fetch
        return router.fetch(request, env, ctx);
    },
};