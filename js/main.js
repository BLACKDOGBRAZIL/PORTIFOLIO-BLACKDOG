/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
const bgGlow = document.getElementById('bg-glow');

// Dot follows mouse instantly via RAF — no CSS transition on the dot
let mx = 0, my = 0;
let rx = 0, ry = 0;
let rafId;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
}, { passive: true });

function animCursor() {
    // Dot: instant, direct position — zero lag
    cursor.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;

    // Ring: smooth lerp — factor 0.22 is snappy but still fluid
    rx += (mx - rx) * 0.22;
    ry += (my - ry) * 0.22;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;

    // Glow segue o mouse com a mesma suavidade do anel
    if (bgGlow) {
        bgGlow.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    }

    rafId = requestAnimationFrame(animCursor);
}
animCursor();

// Expand ring on any interactive element
const interactiveSelector = 'a,button,input,select,textarea,label,.port-card,.svc-card,.filter-btn,.lang-btn,.sobre-tag';
document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => {
        ring.style.width = '44px';
        ring.style.height = '44px';
        ring.style.borderColor = 'rgba(15,110,86,.7)';
    });
    el.addEventListener('mouseleave', () => {
        ring.style.width = '28px';
        ring.style.height = '28px';
        ring.style.borderColor = 'rgba(15,110,86,.5)';
    });
});

// Hide cursors when mouse leaves window
document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    ring.style.opacity = '1';
});

/* ── TOUCH GLOW — mobile ── */
(function initTouchGlow() {
    if (!bgGlow) return;

    // Only activate on touch devices
    if (!('ontouchstart' in window)) return;

    // Previne Layout Reflow precoce (LCP Block) evitando window.innerWidth no preload
    let tx = 0;
    let ty = 0;
    let gx = tx, gy = ty;
    let touching = false;
    let fadeTimer = null;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animGlow() {
        gx = lerp(gx, tx, 0.1);
        gy = lerp(gy, ty, 0.1);
        bgGlow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
        requestAnimationFrame(animGlow);
    }
    animGlow();

    document.addEventListener('touchstart', e => {
        const t = e.touches[0];
        tx = t.clientX;
        ty = t.clientY;
        touching = true;
        clearTimeout(fadeTimer);
        bgGlow.style.opacity = '1';
        bgGlow.style.transition = 'opacity 0.3s';
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        const t = e.touches[0];
        tx = t.clientX;
        ty = t.clientY;
    }, { passive: true });

    document.addEventListener('touchend', () => {
        touching = false;
        fadeTimer = setTimeout(() => {
            bgGlow.style.transition = 'opacity 1.5s';
            bgGlow.style.opacity = '0.6';
        }, 800);
    }, { passive: true });
})();

/* ── SCROLL REVEAL ── */
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } });
}, { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── COUNTERS ── */
function animCount(el, target, dur) {
    let v = 0; const step = target / (dur / 16);
    const tmr = setInterval(() => { v = Math.min(v + step, target); el.textContent = Math.floor(v); if (v >= target) clearInterval(tmr) }, 16);
}
const statObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            document.querySelectorAll('.count').forEach(el => animCount(el, parseInt(el.dataset.target), 1400));
            statObs.disconnect();
        }
    });
}, { threshold: .3 });
const statsEl = document.getElementById('stats');
if (statsEl) statObs.observe(statsEl);

/* ── PORTFOLIO FILTER ── */
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.port-item').forEach(card => {
            card.style.display = (f === 'all' || card.dataset.category === f) ? '' : 'none';
        });
    });
});

/* ── FORM SUBMIT ── */
function handleSubmit() {
    const nome = document.getElementById('f-nome').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const msg = document.getElementById('f-msg').value.trim();
    const toast = document.getElementById('toast');

    if (!nome || !email || !msg) {
        toast.textContent = t('toast.error');
        toast.style.borderColor = 'rgba(224,74,74,.3)';
        toast.style.color = '#E04A4A';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
        return;
    }

    const btn = document.getElementById('submit-btn');
    const servico = document.getElementById('f-servico').value || t('wa.unknown');
    const tel = document.getElementById('f-tel').value || t('wa.unknown');

    btn.disabled = true;
    btn.style.opacity = '0.7';

    // WhatsApp
    const text = encodeURIComponent(
        `${t('wa.greeting')}\n\n${t('wa.name')}: ${nome}\n${t('wa.email')}: ${email}\n${t('wa.phone')}: ${tel}\n${t('wa.service')}: ${servico}\n\n${t('wa.message')}:\n${msg}`
    );
    window.open(`https://wa.me/5581998920712?text=${text}`, '_blank');

    // Email via EmailJS — silencioso em background
    if (typeof emailjs !== 'undefined') {
        emailjs.send('service_5hwzyyn', 'template_s5nmcdv', {
            nome: nome, email: email, tel: tel, servico: servico, mensagem: msg
        }).catch(err => console.warn('EmailJS:', err));
    }

    toast.textContent = t('toast.success');
    toast.style.borderColor = 'rgba(15,110,86,.3)';
    toast.style.color = '#1D9E75';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);

    // Clear form
    ['f-nome', 'f-email', 'f-tel', 'f-msg'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-servico').selectedIndex = 0;
    setTimeout(() => { btn.disabled = false; btn.style.opacity = ''; }, 3000);
}

/* ── HAMBURGER MENU ── */
const hamburgers = document.querySelectorAll('.nav-hamburger');
let menuOpen = false;

hamburgers.forEach(hamburger => {
    hamburger.addEventListener('click', () => {
        menuOpen = !menuOpen;
        // Toggle the Glassmorphism overlay
        let glOverlay = document.getElementById('gl-overlay');
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        
        if (!glOverlay) {
            glOverlay = document.createElement('div');
            glOverlay.id = 'gl-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'gl-modal';
            
            const label = document.createElement('div');
            label.className = 'gl-label';
            label.textContent = 'MENU';
            
            const linksWrap = document.createElement('div');
            linksWrap.className = 'gl-links';
            
            const links = [
                { href: '#sobre', key: 'nav.about' },
                { href: '#portfolio', key: 'nav.work' },
                { href: '#servicos', key: 'nav.services' },
                { href: '#contato', key: 'nav.contact' },
            ];
            
            links.forEach(l => {
                const a = document.createElement('a');
                a.href = l.href;
                a.dataset.i18n = l.key;
                a.textContent = typeof t === 'function' ? t(l.key) : l.key.split('.')[1];
                a.addEventListener('click', () => closeMobileMenu());
                linksWrap.appendChild(a);
            });
            
            const footer = document.createElement('div');
            footer.className = 'gl-footer';
            
            const cEmail = document.createElement('div');
            cEmail.className = 'gl-col';
            cEmail.innerHTML = `<span>Email</span><a href="mailto:blckdogbrasil@gmail.com">blckdogbrasil@gmail.com</a>`;
            
            const cPhone = document.createElement('div');
            cPhone.className = 'gl-col';
            cPhone.innerHTML = `<span>WhatsApp</span><a href="https://wa.me/5581998920712" target="_blank" rel="noopener">+55 81 99892-0712</a>`;
            
            footer.appendChild(cEmail);
            footer.appendChild(cPhone);
            
            const btnQuote = document.createElement('button');
            btnQuote.className = 'gl-btn-quote';
            btnQuote.innerHTML = `<span class="cross-icon" style="font-size:16px;">✧</span> <span data-i18n="nav.cta">${typeof t === 'function' ? t('nav.cta') : 'Iniciar Projeto'}</span>`;
            btnQuote.onclick = () => {
                closeMobileMenu();
                document.getElementById('contato').scrollIntoView({behavior:'smooth'});
            };
            
            modal.appendChild(label);
            modal.appendChild(linksWrap);
            modal.appendChild(footer);
            modal.appendChild(btnQuote);
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'gl-close-btn';
            closeBtn.setAttribute('aria-label', 'Fechar menu');
            closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
            closeBtn.onclick = () => closeMobileMenu();
            
            glOverlay.appendChild(modal);
            glOverlay.appendChild(closeBtn);
            
            document.body.appendChild(glOverlay);
        }
        
        if (menuOpen) {
            glOverlay.classList.add('active');
            hamburgers.forEach(h => {
                h.querySelectorAll('span')[0].style.transform = 'rotate(45deg) translate(4px,4px)';
                h.querySelectorAll('span')[1].style.opacity = '0';
                h.querySelectorAll('span')[2].style.transform = 'rotate(-45deg) translate(4px,-4px)';
            });
        } else {
            closeMobileMenu();
        }
    });
});

function closeMobileMenu() {
    menuOpen = false;
    const glOverlay = document.getElementById('gl-overlay');
    if (glOverlay) { glOverlay.classList.remove('active'); }
    hamburgers.forEach(h => {
        h.querySelectorAll('span')[0].style.transform = '';
        h.querySelectorAll('span')[1].style.opacity = '';
        h.querySelectorAll('span')[2].style.transform = '';
    });
}

/* ── EMAILJS — ENVIO DIRETO ── */
(function () {
    emailjs.init({ publicKey: 'I9-2WpfO49xLKi3ZT' });
})();



/* ── ACTIVE NAV ── */
const sections = ['hero', 'sobre', 'portfolio', 'servicos', 'contato'];
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    const y = window.scrollY + 80;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    sections.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && y >= el.offsetTop && (i === sections.length - 1 || y < document.getElementById(sections[i + 1]).offsetTop)) {
            navLinks.forEach(l => l.style.color = isLight ? '#3A3834' : '');
            if (navLinks[i]) navLinks[i].style.color = 'var(--accent-l)';
        }
    });
}, { passive: true });

/* ── INIT ── */
document.documentElement.setAttribute('data-lang', currentLang);

window.addEventListener('load', () => {
    document.querySelectorAll('#hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 100 + i * 120);
    });
});




/* ══════════════════════════════════════
   2. SCROLL-DRIVEN SECTION TITLES
   Chars reveal + accent line sweep
══════════════════════════════════════ */
(function initScrollDriven() {
    const sectionTitles = document.querySelectorAll(
        '.portfolio-title, .services-title, .contact-title, .sobre-title'
    );

    sectionTitles.forEach(el => {
        // Add scroll line
        const line = document.createElement('div');
        line.className = 'scroll-line';
        el.style.position = 'relative';
        el.appendChild(line);

        // Observe
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    line.classList.add('active');
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        obs.observe(el);
    });

    // Char-by-char reveal for section labels (mono metadata)
    const labels = document.querySelectorAll(
        '.sobre-section-label, .contact-section-label, .portfolio-section-num, .services-header .mono'
    );
    labels.forEach(el => {
        const text = el.textContent;
        el.innerHTML = text.split('').map((c, i) =>
            `<span class="char-reveal" style="transition-delay:${i * 0.03}s">${c === ' ' ? '&nbsp;' : c}</span>`
        ).join('');

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    el.querySelectorAll('.char-reveal').forEach(ch => ch.classList.add('visible'));
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.8 });
        obs.observe(el);
    });
})();

/* ══════════════════════════════════════
   6. MAGNETIC BUTTONS
   CTA buttons attract cursor on proximity
══════════════════════════════════════ */
(function initMagnetic() {
    if (window.innerWidth <= 768) return;

    const magnets = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta');
    magnets.forEach(btn => {
        btn.classList.add('mag-btn');

        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const radius = Math.max(rect.width, rect.height) * 1.1;

            if (dist < radius) {
                const strength = 0.38;
                const tx = dx * strength;
                const ty = dy * strength;
                btn.style.transform = `translate(${tx}px, ${ty}px)`;
            }
        }, { passive: true });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0,0)';
        });
    });

    // Re-init on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            magnets.forEach(btn => { btn.style.transform = ''; });
        }
    }, { passive: true });
})();

/* ══════════════════════════════════════
   3. GLASSMORPHISM NAV on scroll
══════════════════════════════════════ */
(function initGlassNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        const isScrolled = window.scrollY > 80;
        nav.classList.toggle('scrolled', isScrolled);
    }, { passive: true });
})();


/* ══════════════════════════════════════
   1. LIVE WIDGET — Clock + Weather
   Open-Meteo API (free, no key needed)
   Recife coords: -8.0539, -34.8811
══════════════════════════════════════ */
(function initLiveWidget() {
    const el = document.getElementById('live-widget');
    if (!el) return;

    const LAT = -8.0539;
    const LON = -34.8811;
    const TZ = 'America/Recife';

    // Weather code → emoji + label
    const WX = {
        0: ['☀️', 'Clear'], 1: ['🌤', 'Mostly Clear'],
        2: ['⛅', 'Partly Cloudy'], 3: ['☁️', 'Overcast'],
        45: ['🌫', 'Foggy'], 48: ['🌫', 'Foggy'],
        51: ['🌦', 'Drizzle'], 61: ['🌧', 'Rain'],
        71: ['❄️', 'Snow'], 80: ['🌧', 'Showers'],
        95: ['⛈', 'Thunderstorm'],
    };

    let weatherData = null;
    let wxLoaded = false;

    // ── Fetch weather (Open-Meteo, free, no API key) ──
    async function fetchWeather() {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weathercode&timezone=${TZ}&forecast_days=1`;
            const res = await fetch(url);
            const json = await res.json();
            weatherData = {
                temp: Math.round(json.current.temperature_2m),
                code: json.current.weathercode,
            };
            wxLoaded = true;
        } catch (e) {
            wxLoaded = true; // fail silently
        }
    }

    // ── Clock tick ──
    function tick() {
        const now = new Date();
        // Format in Recife timezone
        const timeStr = now.toLocaleTimeString('pt-BR', {
            timeZone: TZ,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        // Split HH:MM:SS for blinking colon
        const [hh, mm, ss] = timeStr.split(':');

        // Build weather string
        let wxStr = '';
        if (weatherData) {
            const [icon] = WX[weatherData.code] || ['🌡️', ''];
            wxStr = `<span class="wg-sep">•</span><span class="wg-temp">${icon} ${weatherData.temp}°C</span>`;
        }

        el.innerHTML =
            `Recife, PE` +
            `<span class="wg-sep">—</span>` +
            `Brasil 🌐` +
            `<span class="wg-sep">•</span>` +
            `<span class="wg-time">${hh}<span class="time-colon">:</span>${mm}<span class="time-colon">:</span>${ss}</span>` +
            wxStr;
    }

    // Init
    fetchWeather();
    tick();
    setInterval(tick, 1000);
    // Refresh weather every 10 min
    setInterval(fetchWeather, 600_000);
})();

/* ══════════════════════════════════════
   3. VIEW TRANSITIONS API
   Smooth page transitions + port card
   "fly-out" when navigating to project
══════════════════════════════════════ */
(function initViewTransitions() {
    if (!document.startViewTransition) return;

    // Intercept internal anchor clicks for smooth transitions
    document.addEventListener('click', e => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const url = a.getAttribute('href');
        // Only same-origin, non-hash links
        if (!url || url.startsWith('#') || url.startsWith('http') || url.startsWith('mailto')) return;
        e.preventDefault();
        document.startViewTransition(() => {
            window.location.href = url;
        });
    });

    // Port card click — assign view-transition-name dynamically before nav
    document.querySelectorAll('.port-card').forEach((card, i) => {
        card.addEventListener('click', () => {
            card.style.viewTransitionName = `port-active`;
        });
    });
})();

/* ══════════════════════════════════════
   4. SKEUOMORPHIC AUDIO
   Subtle mechanical click on interactive
   elements — synthesised via Web Audio API
   (no external files needed)
══════════════════════════════════════ */
(function initAudio() {
    let ctx = null;
    let enabled = false;

    // Create AudioContext on first interaction (browser policy)
    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            enabled = true;
        }
        return ctx;
    }

    // ── Click sound: short noise burst + low-pass filter ──
    function playClick(type = 'soft') {
        if (!enabled && !ctx) return;
        const ac = getCtx();
        const buf = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate);
        const data = buf.getChannelData(0);

        // White noise, decaying
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        }

        const src = ac.createBufferSource();
        src.buffer = buf;

        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = type === 'soft' ? 800 : 1400;
        filter.Q.value = 0.8;

        const gain = ac.createGain();
        gain.gain.setValueAtTime(type === 'soft' ? 0.055 : 0.04, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.04);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        src.start();
    }

    // ── Attach to interactive elements ──
    function attachSound(selector, type = 'soft') {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('click', () => playClick(type), { passive: true });
        });
    }

    // Soft click: buttons, nav links, filter buttons
    attachSound('.btn-primary, .btn-secondary, .nav-cta, .nav-links a', 'soft');
    // Sharper tick: filter buttons, lang toggle, portfolio cards
    attachSound('.filter-btn, .lang-btn, .port-card, .svc-card', 'tick');

    // Enable context on first any-click (required by browsers)
    document.addEventListener('click', () => { if (!ctx) getCtx(); }, { once: true, passive: true });
})();


/* ══════════════════════════════════════
   LENIS — SMOOTH SCROLL
══════════════════════════════════════ */
(function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8,
    });

    // Connect Lenis to RAF
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Fix anchor links to use Lenis
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (target) lenis.scrollTo(target, { offset: -60, duration: 1.4 });
        });
    });
})();


/* ══════════════════════════════════════
   HERO VIDEO — autodetect & crossfade
   Coloque video-reel.mp4 na mesma pasta
══════════════════════════════════════ */
(function initHeroVideo() {
    const video = document.getElementById('hero-video');
    const overlay = document.getElementById('hero-video-overlay');
    const canvas = document.getElementById('hero-canvas');
    if (!video) return;

    video.addEventListener('canplay', () => {
        // Video loaded — fade in video, fade out canvas
        video.style.opacity = '0.9';
        overlay.style.opacity = '1';
        canvas.style.transition = 'opacity 1s ease';
        canvas.style.opacity = '0.15'; // keep subtle particle bg
    });

    video.addEventListener('error', () => {
        // No video file — keep canvas (default)
        video.style.display = 'none';
    });
})();


/* ══════════════════════════════════════
   THEME TOGGLE — Light / Dark
══════════════════════════════════════ */
(function initTheme() {
    const root = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const stored = localStorage.getItem('bd-theme') || 'light';

    const SVG_SUN = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const SVG_MOON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    function applyTheme(theme) {
        const label = document.getElementById('theme-label');
        const icon = document.getElementById('theme-icon');
        const mIcon = document.getElementById('theme-icon-mobile');
        const mLabel = document.getElementById('theme-label-mobile');
        const lang = (typeof currentLang !== 'undefined' ? currentLang : null) || root.getAttribute('data-lang') || localStorage.getItem('bd-lang') || 'pt';

        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
            if (icon) icon.innerHTML = SVG_MOON;
            if (mIcon) mIcon.innerHTML = SVG_MOON;
            if (label) label.textContent = lang === 'en' ? 'Dark Mode' : 'Modo Escuro';
            if (mLabel) mLabel.textContent = lang === 'en' ? 'Dark Mode' : 'Modo Escuro';
            localStorage.setItem('bd-theme', 'light');
            updateThreeColors(true);
        } else {
            root.removeAttribute('data-theme');
            if (icon) icon.innerHTML = SVG_SUN;
            if (mIcon) mIcon.innerHTML = SVG_SUN;
            if (label) label.textContent = lang === 'en' ? 'Light Mode' : 'Modo Claro';
            if (mLabel) mLabel.textContent = lang === 'en' ? 'Light Mode' : 'Modo Claro';
            localStorage.setItem('bd-theme', 'dark');
            updateThreeColors(false);
        }
        // Sync mobile menu if open
        const overlay = document.getElementById('mobile-menu');
        if (overlay && overlay.style.opacity === '1') {
            const light = theme === 'light';
            overlay.style.background = light ? 'rgba(245,241,232,0.98)' : 'rgba(10,10,8,0.97)';
            const textColor = light ? '#1A1916' : '#F5F1E8';
            overlay.querySelectorAll('a').forEach(a => a.style.color = textColor);
            const closeBtn = overlay.querySelector('button[aria-label="Fechar menu"]') || overlay.querySelector('button[style*="font-size:24px"]');
            if (closeBtn) closeBtn.style.color = textColor;
        }
    }

    function updateThreeColors(isLight) {
        // Will be picked up by Three.js on next frame if scene exists
        window.__bdThemeLight = isLight;
    }

    window.toggleTheme = function () {
        const current = root.getAttribute('data-theme');
        applyTheme(current === 'light' ? 'dark' : 'light');
    };

    // Apply stored preference on load
    applyTheme(stored);
})();