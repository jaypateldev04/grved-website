/* Lead form: accessible validation + honest submit states.
   Submits to window.GRVED_CONFIG.formEndpoint (set at build time, see docs/FORM_SETUP.md).
   Expected response: JSON { ok: true } or { ok: false, error: "..." }.
   If no endpoint is configured the form says so — it never pretends to send. */
(() => {
  'use strict';
  const config = window.GRVED_CONFIG || {};
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name (at least 2 characters).',
    email: (v) => EMAIL_RE.test(v.trim()) || 'Please enter a valid email address, like name@company.com.',
    phone: (v) => {
      const text = v.trim();
      if (!text) return true;
      const digits = text.replace(/\D/g, '');
      const ok = /^[+\d\s()\-.]+$/.test(text) && digits.length >= 7 && digits.length <= 15;
      return ok || 'Please enter a valid phone number (7–15 digits), or leave it empty.';
    },
    service: (v) => Boolean(v) || 'Please choose a service.',
    message: (v) => v.trim().length >= 10 || 'Please tell us a little about your project (at least 10 characters).',
  };

  const checkField = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    const ok = result === true;
    const error = field.closest('.field').querySelector('.field-error');
    field.classList.toggle('is-invalid', !ok);
    field.setAttribute('aria-invalid', String(!ok));
    error.textContent = ok ? '' : result;
    error.hidden = ok;
    return ok;
  };

  const init = (form) => {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');
    const shownAt = Date.now();

    // Optional Cloudflare Turnstile (only when a site key was supplied at build time, see docs/FORM_SETUP.md)
    const holder = form.querySelector('[data-turnstile]');
    let widgetId = null;
    let token = '';
    if (config.turnstileSiteKey && holder) {
      holder.hidden = false;
      window.__grvedTurnstile = () => {
        widgetId = window.turnstile.render(holder, {
          sitekey: config.turnstileSiteKey,
          callback: (t) => { token = t; },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; },
        });
      };
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__grvedTurnstile';
      script.async = true;
      document.head.appendChild(script);
    }

    const setStatus = (type, text) => {
      status.hidden = !text;
      status.className = `form-status form-status--${type}`;
      status.setAttribute('role', type === 'error' ? 'alert' : 'status');
      status.textContent = text;
    };

    form.addEventListener('focusout', (event) => {
      if (event.target.name in rules && event.target.value !== '') checkField(event.target);
    });
    form.addEventListener('input', (event) => {
      if (event.target.classList.contains('is-invalid')) checkField(event.target);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('info', '');

      const fields = [...form.elements].filter((el) => el.name in rules);
      const invalid = fields.filter((el) => !checkField(el));
      if (invalid.length) {
        invalid[0].focus();
        setStatus('error', 'Please fix the highlighted fields and try again.');
        return;
      }

      if (!config.formEndpoint) {
        setStatus('error', 'This form is not connected to the lead inbox yet. Please call or WhatsApp us instead.');
        return;
      }

      if (config.turnstileSiteKey && !token) {
        setStatus('error', 'Please complete the security check and try again.');
        return;
      }

      const body = new URLSearchParams(new FormData(form));
      if (token) body.set('cf_turnstile_response', token);
      body.set('elapsed', String(Date.now() - shownAt));
      body.set('page', window.location.pathname);

      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      setStatus('info', 'Sending…');
      try {
        // URL-encoded body = a "simple" request, so no CORS preflight is needed.
        const response = await fetch(config.formEndpoint, { method: 'POST', body });
        const result = await response.json();
        if (!response.ok || !result || result.ok !== true) throw new Error((result && result.error) || 'failed');
        form.reset();
        token = '';
        if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
        setStatus('success', 'Thank you! We have received your message and will reply within one business day.');
      } catch (err) {
        setStatus('error', 'Sorry, we could not send your message. Please try again, or call or WhatsApp us.');
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
    });
  };

  document.querySelectorAll('form[data-lead-form]').forEach(init);
})();
