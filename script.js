// S. M. Mahbub Uddin Ahmed — interactions
// Everything here is progressive enhancement: the page reads fine without it.

document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#121513' : '#f3f3ef');
    if (toggle) {
      const next = theme === 'dark' ? 'light' : 'dark';
      const label = 'Switch to ' + next + ' theme';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    }
    if (persist) {
      try { localStorage.setItem('theme', theme); } catch (e) { /* storage blocked */ }
    }
  }

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  // Follow the operating system only while the visitor has not chosen a theme.
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event) => {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { /* ignore */ }
    if (!stored) applyTheme(event.matches ? 'dark' : 'light', false);
  };
  if (typeof darkQuery.addEventListener === 'function') {
    darkQuery.addEventListener('change', onSystemChange);
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Active navigation ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  const targets = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (targets.length) {
    const nav = document.querySelector('.nav');
    let lastActive = -1;
    let ticking = false;

    function updateActive() {
      const line = 140; // a section counts as current once its top passes this line
      let current = -1;

      targets.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= line) current = i;
      });

      // at the very bottom, the last section wins
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = targets.length - 1;
      }

      navLinks.forEach((link, i) => {
        link.classList.toggle('is-active', i === current);
        if (i === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });

      // On narrow screens the nav scrolls sideways: keep the current link in view.
      if (nav && current !== lastActive && nav.scrollWidth > nav.clientWidth) {
        const link = navLinks[current];
        let left = 0;
        if (link) {
          const l = link.getBoundingClientRect();
          const n = nav.getBoundingClientRect();
          left = nav.scrollLeft + (l.left - n.left) - (nav.clientWidth - l.width) / 2;
        }
        nav.scrollTo({ left: Math.max(0, left), behavior: prefersReduced ? 'auto' : 'smooth' });
      }
      lastActive = current;

      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateActive();
  }

  /* ---------- One reveal per section, never on the hero ---------- */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const blocks = document.querySelectorAll(
      '.section-head, .papers > li, .work > li, .spec-row, .record, .contact > *'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    blocks.forEach((block, i) => {
      block.classList.add('reveal');
      // stagger within a group, capped so nothing lags behind the reader
      block.style.transitionDelay = Math.min(i % 4, 3) * 60 + 'ms';
      observer.observe(block);
    });
  }

  /* ---------- Copy citation ---------- */
  document.querySelectorAll('.copy-btn').forEach(button => {
    const label = button.textContent;
    let timer;

    button.addEventListener('click', async function () {
      const citation = button.getAttribute('data-cite') || '';
      let copied = false;

      try {
        await navigator.clipboard.writeText(citation);
        copied = true;
      } catch (error) {
        // Clipboard API needs a secure context; fall back to a hidden selection.
        const holder = document.createElement('textarea');
        holder.value = citation;
        holder.setAttribute('readonly', '');
        holder.style.position = 'fixed';
        holder.style.top = '-1000px';
        document.body.appendChild(holder);
        holder.select();
        try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
        document.body.removeChild(holder);
      }

      clearTimeout(timer);
      button.textContent = copied ? 'Citation copied' : 'Press Ctrl+C to copy';
      button.setAttribute('data-done', 'true');

      if (!copied) {
        window.prompt('Copy the citation:', citation);
      }

      timer = setTimeout(() => {
        button.textContent = label;
        button.removeAttribute('data-done');
      }, 1800);
    });
  });

  /* ---------- Contact form ---------- */
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');

  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      setStatus('Add your name, email and a message.', 'error');
      (!name ? form.name : !email ? form.email : form.message).focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('That email address looks incomplete.', 'error');
      form.email.focus();
      return;
    }

    const original = submit.textContent;
    submit.textContent = 'Sending';
    submit.disabled = true;
    setStatus('Sending your message.', null);

    try {
      const response = await fetch('https://formspree.io/f/mqabpdla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message, _replyto: email })
      });

      if (!response.ok) throw new Error('Request failed: ' + response.status);

      form.reset();
      setStatus('Sent. I will reply to the address you gave.', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('That did not send. Email hridoyahmedddd@gmail.com instead.', 'error');
    } finally {
      submit.textContent = original;
      submit.disabled = false;
    }
  });
});
