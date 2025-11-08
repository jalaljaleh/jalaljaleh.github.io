
async function updateAge() {
    const DOB_ISO = '2001-07-05T16:30:00Z';
    const EL = document.getElementById('ageValue');
    if (!EL) return;

    const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.2425;
    function update() {
        const dob = new Date(DOB_ISO);
        if (isNaN(dob)) { EL.textContent = '—'; return; }
        const years = (Date.now() - dob.getTime()) / MS_PER_YEAR;
        EL.textContent = years.toFixed(11);
    }
    update();
    setInterval(update, 60);
};




(async () => {

    await updateAge();

    import('./notification.js')
        .then(m => new m.default().send())
        .catch(console.error);

    import('./githubRepositories.js')
        .then(mod => mod.renderProjects())
        .catch(console.error);

})();

(function () {

    const ENDPOINT = 'https://api.jalaljaleh.workers.dev/contact';

    const openBtn = document.getElementById('openContact');
    const form = document.getElementById('contactForm');
    const cancel = document.getElementById('cf-cancel');
    const send = document.getElementById('cf-send');
    const status = document.getElementById('cf-status');

    function showForm() {
        if (!form) return;
        form.style.display = 'flex';
        openBtn && openBtn.setAttribute('aria-expanded', 'true');
        const messageInput = form.querySelector('#cf-message');
        messageInput && messageInput.focus();
    }
    function hideForm() {
        if (!form) return;
        form.style.display = 'none';
        openBtn && openBtn.setAttribute('aria-expanded', 'false');
        status.textContent = '';
        form.reset();
    }

    openBtn && openBtn.addEventListener('click', showForm);
    cancel && cancel.addEventListener('click', hideForm);

    send && send.addEventListener('click', async () => {
        if (!status) return;
        status.style.color = getComputedStyle(document.documentElement).getPropertyValue('--muted') || '#999';
        status.textContent = 'Sending…';

        const name = (document.getElementById('cf-name') || {}).value?.trim() || 'no name';
        const email = (document.getElementById('cf-email') || {}).value?.trim() || 'no email';
        const message = (document.getElementById('cf-message') || {}).value?.trim();

        if (!message) {
            status.style.color = '#ff8b8b';
            status.textContent = 'Please write a message!';
            return;
        }

        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
                credentials: 'omit'
            });

            // If fetch succeeded but returned non-2xx, show the returned body for debugging
            if (!res.ok) {
                const text = await res.text().catch(() => `HTTP ${res.status}`);
                console.error('Contact endpoint error:', res.status, text);
                status.style.color = '#ffd8a8';
                status.textContent = `Server error: ${res.status} — ${text}`;
                return;
            }

            // expect JSON {ok:true}
            const json = await res.json().catch(() => null);
            if (json && json.ok) {
                status.style.color = '#b8ffcf';
                status.textContent = 'Message sent — thank you!';
                setTimeout(hideForm, 5000);
            } else {
                status.style.color = '#ffd8a8';
                status.textContent = 'Unexpected server response';
                console.warn('Unexpected contact response', json);
            }
        } catch (err) {
            // Network-level error (DNS, CORS preflight blocked, mixed content, etc.)
            console.error('Fetch failed', err);
            status.style.color = '#ffd8a8';
            status.textContent = 'Could not send via server, opening email client…';

            const subject = encodeURIComponent(`Message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:jalaljaleh@gmail.com?subject=${subject}&body=${body}`;
            setTimeout(hideForm, 4000);
        }
    });
})();
