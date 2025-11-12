// js/contact.js
export default class Contact {
    constructor(endpoint = 'https://api.jalaljaleh.workers.dev/message') {
        this.ENDPOINT = endpoint; // exact endpoint preserved
        this.openBtn = document.getElementById('openContact');
        this.form = document.getElementById('contactForm');
        this.cancel = document.getElementById('cf-cancel');
        this.send = document.getElementById('cf-send');
        this.status = document.getElementById('cf-status');
    }

    contact() {
        if (!this.openBtn || !this.form) return;

        this.openBtn.addEventListener('click', () => this.showForm());
        this.cancel && this.cancel.addEventListener('click', () => this.hideForm());
        this.send && this.send.addEventListener('click', () => this.onSendClick());
    }

    showForm() {
        if (!this.form) return;
        this.form.style.display = 'flex';
        this.openBtn && this.openBtn.setAttribute('aria-expanded', 'true');
        const messageInput = this.form.querySelector('#cf-message');
        messageInput && messageInput.focus();
    }

    hideForm() {
        if (!this.form) return;
        this.form.style.display = 'none';
        this.openBtn && this.openBtn.setAttribute('aria-expanded', 'false');
        this.status && (this.status.textContent = '');
        this.form.reset();
    }

    async onSendClick() {
        if (!this.status) return;
        this.status.style.color = getComputedStyle(document.documentElement).getPropertyValue('--muted') || '#999';
        this.status.textContent = 'Sending…';

        const name = (document.getElementById('cf-name') || {}).value?.trim() || 'no name';
        const email = (document.getElementById('cf-email') || {}).value?.trim() || 'no email';
        const message = (document.getElementById('cf-message') || {}).value?.trim();

        if (!message) {
            this.status.style.color = '#ff8b8b';
            this.status.textContent = 'Please write a message!';
            return;
        }

        try {
            const res = await fetch(this.ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
                credentials: 'omit'
            });

            if (!res.ok) {
                const text = await res.text().catch(() => `HTTP ${res.status}`);
                console.error('Contact endpoint error:', res.status, text);
                this.status.style.color = '#ffd8a8';
                this.status.textContent = `Server error: Can't send the message!`;
                return;
            }

            const json = await res.json().catch(() => null);
            if (json && json.ok) {
                this.status.style.color = '#b8ffcf';
                this.status.textContent = 'Message sent — thank you!';
                setTimeout(() => this.hideForm(), 3000);
            } else {
                this.status.style.color = '#ffd8a8';
                this.status.textContent = 'Unexpected server response';
                console.warn('Unexpected contact response', json);
            }
        } catch (err) {
            console.error('Fetch failed', err);
            this.status.style.color = '#ffd8a8';
            this.status.textContent = 'Could not send via server, opening email client…';

            const subject = encodeURIComponent(`Message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:jalaljaleh@gmail.com?subject=${subject}&body=${body}`;
            setTimeout(() => this.hideForm(), 4000);
        }
    }
}
