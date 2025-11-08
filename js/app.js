
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

    //import('./notification.js')
    //    .then(m => new m.default().send())
    //    .catch(console.error);

    import('./githubRepositories.js')
        .then(mod => mod.renderProjects())
        .catch(console.error);

})();




(function () {
    const ENDPOINT = 'http://api.jalaljaleh.workers.dev/contact';

    const openBtn = document.getElementById('openContact');
    const form = document.getElementById('contactForm');
    const cancel = document.getElementById('cf-cancel');
    const send = document.getElementById('cf-send');
    const status = document.getElementById('cf-status');

    function showForm() {
        form.style.display = 'flex';
        openBtn.setAttribute('aria-expanded', 'true');
        form.querySelector('#cf-name').focus();
    }
    function hideForm() {
        form.style.display = 'none';
        openBtn.setAttribute('aria-expanded', 'false');
        status.textContent = '';
        form.reset();
    }

    openBtn && openBtn.addEventListener('click', showForm);
    cancel && cancel.addEventListener('click', hideForm);

    send && send.addEventListener('click', async () => {
        status.style.color = 'var(--muted)';
        status.textContent = 'Sending…';

        const name = document.getElementById('cf-name').value.trim() || 'no name';
        const email = document.getElementById('cf-email').value.trim() || 'no email';
        const message = document.getElementById('cf-message').value.trim();
        if (!name || !email || !message) {
            status.style.color = '#ff8b8b';
            status.textContent = 'Please write a message !';
            return;
        }

        // Try POST to your endpoint
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            if (res.ok) {
                status.style.color = '#b8ffcf';
                status.textContent = 'Message sent — thank you!';
                setTimeout(hideForm, 1500);
                return;
            } else {
                // fallthrough to mailto fallback
                throw new Error('endpoint error:' + res.status);
            }
        } catch (err) {
            // Fallback: open mailto with prefilled subject/body
            status.style.color = '#ffd8a8';
            status.textContent = 'Could not send via server, opening email client…';
            const subject = encodeURIComponent(`Message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:jalaljaleh@gmail.com?subject=${subject}&body=${body}`;
            setTimeout(hideForm, 1200);
        }
    });

})();
