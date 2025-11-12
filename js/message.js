// js/contact.js
export default class Message {
    constructor(endpoint = 'https://api.jalaljaleh.workers.dev/message') {
        this.ENDPOINT = endpoint;
        this.openBtn = document.getElementById('openContact');
        this.form = document.getElementById('contactForm');
        this.cancel = document.getElementById('cf-cancel');
        this.send = document.getElementById('cf-send');
        this.status = document.getElementById('cf-status');
    }

    init() {
        if (!this.openBtn || !this.form) return;
        this.openBtn.addEventListener('click', () => this.showForm());
        this.cancel && this.cancel.addEventListener('click', (e) => { e.preventDefault(); this.hideForm(); });
        this.send && this.send.addEventListener('click', (e) => { e.preventDefault(); this.onSendClick(); });
        // optional: submit on Enter from textarea with Ctrl+Enter
        const msg = this.form.querySelector('#cf-message');
        if (msg) {
            msg.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.onSendClick();
                }
            });
        }
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
        if (this.status) {
            this.status.textContent = '';
            this.status.style.color = '';
        }
        this.form.reset();
    }

    setStatus(text, color) {
        if (!this.status) return;
        this.status.textContent = text;
        if (color) this.status.style.color = color;
    }

    async onSendClick() {
        if (!this.status || !this.form) return;

        this.setStatus('Sending…', getComputedStyle(document.documentElement).getPropertyValue('--muted') || '#999');

        const name = (document.getElementById('cf-name') || {}).value?.trim() || 'no name';
        const email = (document.getElementById('cf-email') || {}).value?.trim() || 'no email';
        const message = (document.getElementById('cf-message') || {}).value?.trim();

        if (!message) {
            this.setStatus('Please write a message!', '#ff8b8b');
            return;
        }

        try {
            const res = await fetch(this.ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
                mode: 'cors',
                credentials: 'omit'
            });

            // try parse JSON safely
            const text = await res.text().catch(() => '');
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

            if (!res.ok) {
                console.error('Contact endpoint error:', res.status, text);
                const msg = (json && (json.error || json.detail)) ? json.error || json.detail : `Server error (${res.status})`;
                this.setStatus(`Server error: ${msg}`, '#ffd8a8');
                return;
            }

            if (json && json.ok) {
                this.setStatus('Message sent — thank you!', '#b8ffcf');
                setTimeout(() => this.hideForm(), 3000);
                return;
            }

            // fallback: unexpected but successful HTTP response
            console.warn('Unexpected contact response', json, text);
            this.setStatus('Unexpected server response', '#ffd8a8');

        } catch (err) {
            console.error('Fetch failed', err);
            this.setStatus('Could not send via server, opening email client…', '#ffd8a8');

            const subject = encodeURIComponent(`Message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:jalaljaleh@gmail.com?subject=${subject}&body=${body}`;
            setTimeout(() => this.hideForm(), 4000);
        }
    }
}
