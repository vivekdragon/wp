/* ============================================================
   Wisepath v2 — Main JavaScript
   Zero dependencies • Vanilla ES6+
   ============================================================ */

(function () {
    'use strict';

    var DATA_URL = 'data/site.json';

    /* ----------------------------------------------------------
       Helpers
       ---------------------------------------------------------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function escapeHTML(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function getQueryParam(name) {
        var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : null;
    }

    /* ----------------------------------------------------------
       Navigation — scroll state & mobile toggle
       ---------------------------------------------------------- */
    var nav = document.getElementById('nav');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');

    function handleNavScroll() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ----------------------------------------------------------
       Reveal observer (re-runnable for dynamically added nodes)
       ---------------------------------------------------------- */
    var revealObserver = null;
    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    function observeReveal(scope) {
        var els = $$('.reveal, .reveal-left, .reveal-right', scope || document);
        if (revealObserver) {
            els.forEach(function (el) { if (!el.classList.contains('visible')) revealObserver.observe(el); });
        } else {
            els.forEach(function (el) { el.classList.add('visible'); });
        }
    }
    observeReveal();

    /* ----------------------------------------------------------
       Smooth scroll for anchor links
       ---------------------------------------------------------- */
    document.addEventListener('click', function (e) {
        var anchor = e.target.closest && e.target.closest('a[href^="#"]');
        if (!anchor) return;
        var targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            var offset = nav ? nav.offsetHeight + 16 : 0;
            var top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    });

    /* ----------------------------------------------------------
       Side scroll progress bar with logo pointer
       ---------------------------------------------------------- */
    (function buildSideProgress() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress-side';
        bar.innerHTML = ''
            + '<div class="scroll-progress-side-fill" id="spsFill"></div>'
            + '<div class="scroll-progress-side-pointer" id="spsPointer">'
            +   '<img src="logoonly.png" alt="">'
            + '</div>';
        document.body.appendChild(bar);

        var fill = document.getElementById('spsFill');
        var pointer = document.getElementById('spsPointer');
        var scrollTimer = null;

        // Waypoints matching navbar sections
        var waypointSections = [
            { id: 'hero',         label: 'Home' },
            { id: 'about',        label: 'About' },
            { id: 'services',     label: 'Services' },
            { id: 'projects',     label: 'Projects' },
            { id: 'testimonials', label: 'Testimonials' },
            { id: 'contact',      label: 'Contact' }
        ];
        var waypointEls = [];

        waypointSections.forEach(function (wp) {
            var dot = document.createElement('div');
            dot.className = 'sps-waypoint';
            dot.innerHTML = '<span class="sps-waypoint-label">' + wp.label + '</span>';
            dot.dataset.section = wp.id;
            dot.addEventListener('click', function () {
                var target = document.getElementById(wp.id);
                if (target) {
                    var offset = (document.getElementById('nav') ? document.getElementById('nav').offsetHeight : 0) + 16;
                    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
                }
            });
            bar.appendChild(dot);
            waypointEls.push({ el: dot, id: wp.id });
        });

        function positionWaypoints() {
            var docH = document.documentElement.scrollHeight;
            var maxScroll = docH - window.innerHeight;
            if (maxScroll <= 0) return;

            waypointEls.forEach(function (wp) {
                var section = document.getElementById(wp.id);
                if (!section) return;
                var sectionTop = section.offsetTop;
                // Use the same % formula as the pointer: scroll-to-section / maxScroll
                var pct = (sectionTop / maxScroll) * 100;
                pct = Math.max(0, Math.min(pct, 100));
                wp.el.style.top = pct + '%';
                wp.pct = pct; // cache for highlight comparison
            });
        }

        function highlightWaypoints(pointerPct) {
            var activeIdx = 0;

            for (var i = 0; i < waypointEls.length; i++) {
                // Activate if pointer is within 1.5% before or past the waypoint
                if (waypointEls[i].pct !== undefined && pointerPct >= waypointEls[i].pct - 1.5) {
                    activeIdx = i;
                }
            }

            waypointEls.forEach(function (wp, i) {
                wp.el.classList.toggle('active', i === activeIdx);
            });
        }

        function update() {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
            fill.style.height = pct + '%';
            pointer.style.top = pct + '%';

            // Mark as scrolling
            pointer.classList.add('scrolling');
            pointer.classList.remove('settled');

            // Detect scroll stop
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () {
                pointer.classList.remove('scrolling');
                pointer.classList.add('settled');
            }, 120);

            highlightWaypoints(pct);
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', function () { positionWaypoints(); update(); }, { passive: true });

        // Initial position after a short delay so layout is settled
        setTimeout(function () { positionWaypoints(); update(); }, 100);
    })();

    /* ----------------------------------------------------------
       Cursor glow — desktop only
       ---------------------------------------------------------- */
    if (window.matchMedia('(pointer: fine)').matches) {
        var cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        document.body.appendChild(cursorGlow);

        var mx = window.innerWidth / 2, my = window.innerHeight / 2;
        var gx = mx, gy = my;

        document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

        (function animGlow() {
            gx += (mx - gx) * 0.07;
            gy += (my - gy) * 0.07;
            cursorGlow.style.left = gx + 'px';
            cursorGlow.style.top = gy + 'px';
            requestAnimationFrame(animGlow);
        })();
    }

    /* ----------------------------------------------------------
       Parallax — hero background + hero image + about image
       ---------------------------------------------------------- */
    var heroBg = document.getElementById('heroBg');
    var heroImgWrap = document.querySelector('.hero-image-wrap');
    var aboutImgEl = document.querySelector('.about-image');

    window.addEventListener('scroll', function () {
        var sy = window.scrollY;
        if (heroBg) heroBg.style.transform = 'translateY(' + (sy * 0.38) + 'px)';
        if (heroImgWrap) heroImgWrap.style.transform = 'translateY(' + (sy * 0.12) + 'px)';
        if (aboutImgEl) {
            var rect = aboutImgEl.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                aboutImgEl.style.transform = 'translateY(' + ((rect.top - window.innerHeight * 0.5) * -0.08) + 'px)';
            }
        }
    }, { passive: true });

    /* ----------------------------------------------------------
       Animated stat counters
       ---------------------------------------------------------- */
    var statEls = document.querySelectorAll('.hero-stat-number[data-count]');
    var statsSection = document.querySelector('.hero-stats');
    var statsAnimated = false;

    function countUp(el, target, suffix, duration) {
        var start = performance.now();
        function step(now) {
            var progress = Math.min((now - start) / duration, 1);
            var ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
    }

    if (statsSection && statEls.length && 'IntersectionObserver' in window) {
        var statsObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !statsAnimated) {
                statsAnimated = true;
                statEls.forEach(function (el) {
                    countUp(el, +el.dataset.count, el.dataset.suffix || '', 1600);
                });
                statsObs.disconnect();
            }
        }, { threshold: 0.6 });
        statsObs.observe(statsSection);
    }

    /* ----------------------------------------------------------
       Hero word flip
       ---------------------------------------------------------- */
    var flipEl = document.querySelector('.hero-flip-word');
    var flipWords = ['forward', 'faster', 'smarter', 'further'];
    var flipIdx = 0;
    if (flipEl) {
        setInterval(function () {
            flipEl.classList.add('flip-out');
            setTimeout(function () {
                flipIdx = (flipIdx + 1) % flipWords.length;
                flipEl.textContent = flipWords[flipIdx];
                flipEl.classList.remove('flip-out');
                flipEl.classList.add('flip-in');
                flipEl.offsetHeight;
                flipEl.classList.add('flip-show');
                setTimeout(function () { flipEl.classList.remove('flip-in', 'flip-show'); }, 380);
            }, 230);
        }, 3200);
    }

    /* ----------------------------------------------------------
       Magnetic primary buttons
       ---------------------------------------------------------- */
    document.querySelectorAll('.btn-primary:not(.nav-cta)').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            var x = ((e.clientX - r.left) / r.width - 0.5) * 14;
            var y = ((e.clientY - r.top) / r.height - 0.5) * 10;
            btn.style.transform = 'translateY(-2px) translate(' + x + 'px,' + y + 'px)';
        });
        btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });

    /* ----------------------------------------------------------
       Ambient particles canvas
       ---------------------------------------------------------- */
    (function () {
        var pcCanvas = document.createElement('canvas');
        pcCanvas.id = 'particles-canvas';
        document.body.prepend(pcCanvas);
        var pcCtx = pcCanvas.getContext('2d');
        var pcList = [];

        function pcResize() { pcCanvas.width = window.innerWidth; pcCanvas.height = window.innerHeight; }
        pcResize();
        window.addEventListener('resize', pcResize, { passive: true });

        for (var pi = 0; pi < 60; pi++) {
            pcList.push({
                x: Math.random() * pcCanvas.width,
                y: Math.random() * pcCanvas.height,
                r: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.38 + 0.07,
                opacity: Math.random() * 0.32 + 0.06,
                drift: (Math.random() - 0.5) * 0.28,
                hue: Math.random() > 0.4 ? '79,70,229' : '6,182,212'
            });
        }

        function pcDraw() {
            pcCtx.clearRect(0, 0, pcCanvas.width, pcCanvas.height);
            pcList.forEach(function (p) {
                pcCtx.beginPath();
                pcCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                pcCtx.fillStyle = 'rgba(' + p.hue + ',' + p.opacity + ')';
                pcCtx.fill();
                p.y -= p.speed;
                p.x += p.drift;
                if (p.y < -5) { p.y = pcCanvas.height + 5; p.x = Math.random() * pcCanvas.width; }
                if (p.x < 0) p.x = pcCanvas.width;
                if (p.x > pcCanvas.width) p.x = 0;
            });
            requestAnimationFrame(pcDraw);
        }
        pcDraw();
    })();

    /* ----------------------------------------------------------
       Project detail — sidebar active link on scroll
       ---------------------------------------------------------- */
    function initSidebarActive() {
        var sidebarLinks = $$('.project-sidebar-link');
        if (!sidebarLinks.length) return;
        var sections = [];
        sidebarLinks.forEach(function (link) {
            var id = link.getAttribute('href');
            if (id && id.startsWith('#')) {
                var section = document.querySelector(id);
                if (section) sections.push({ link: link, section: section });
            }
        });
        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY + 120;
            var current = sections[0];
            sections.forEach(function (item) {
                if (item.section.offsetTop <= scrollY) current = item;
            });
            sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
            if (current) current.link.classList.add('active');
        }, { passive: true });
    }

    /* ----------------------------------------------------------
       Contact form — submits to Google Sheets via Apps Script
       Set your deployed Apps Script URL below.
       ---------------------------------------------------------- */
    var GOOGLE_SCRIPT_URL = ''; // <-- Paste your Google Apps Script web app URL here

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = contactForm.querySelector('button[type="submit"]');
            var originalText = btn.innerHTML;

            // Collect form data
            var formData = new FormData(contactForm);

            btn.innerHTML = 'Sending...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            if (!GOOGLE_SCRIPT_URL) {
                // No backend configured — show success anyway (demo mode)
                btn.innerHTML = 'Sent! &check;';
                setTimeout(function () {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                    contactForm.reset();
                }, 2500);
                return;
            }

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData
            })
            .then(function () {
                btn.innerHTML = 'Sent! &check;';
                contactForm.reset();
            })
            .catch(function () {
                btn.innerHTML = 'Error — try again';
            })
            .finally(function () {
                setTimeout(function () {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                }, 2500);
            });
        });
    }

    /* ==========================================================
       DATA LOADING & RENDERING
       ========================================================== */

    function attachCardTilt(card) {
        card.addEventListener('mousemove', function (e) {
            if (card.classList.contains('is-static')) return;
            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transition = 'transform 0.08s';
            card.style.transform = 'perspective(1000px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 7) + 'deg) scale(1.018)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transition = 'transform 0.55s var(--ease-out)';
            card.style.transform = '';
        });
    }

    /* ---------- Services ---------- */
    function renderServices(services) {
        var grid = $('#servicesGrid');
        if (!grid || !services) return;
        grid.innerHTML = services.map(function (s) {
            return ''
                + '<div class="glass-card service-card reveal">'
                +   '<div class="service-icon">' + (s.icon || '') + '</div>'
                +   '<h3>' + escapeHTML(s.title) + '</h3>'
                +   '<p>' + escapeHTML(s.description) + '</p>'
                + '</div>';
        }).join('');
        observeReveal(grid);
        $$('.reveal', grid).forEach(function (card, i) {
            card.style.transitionDelay = (i * 110) + 'ms';
        });
    }

    /* ---------- Projects ---------- */
    function renderProjects(projects, clickable) {
        var grid = $('#projectsGrid');
        if (!grid || !projects) return;

        grid.innerHTML = projects.map(function (p) {
            var tag = '<span class="project-card-tag">' + escapeHTML(p.categoryLabel || p.category) + '</span>';
            var inner = ''
                + '<img class="project-card-image" src="' + escapeHTML(p.image) + '" alt="' + escapeHTML(p.imageAlt || p.title) + '" loading="lazy">'
                + '<div class="project-card-overlay">'
                +   tag
                +   '<h3 class="project-card-title">' + escapeHTML(p.title) + '</h3>'
                +   '<p class="project-card-desc">' + escapeHTML(p.description) + '</p>'
                + '</div>'
                + '<span class="project-card-arrow">'
                +   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>'
                + '</span>';

            if (clickable) {
                return '<a href="project-detail.html?id=' + encodeURIComponent(p.id) + '" class="project-card reveal" data-category="' + escapeHTML(p.category) + '">' + inner + '</a>';
            }
            return '<div class="project-card reveal is-static" data-category="' + escapeHTML(p.category) + '" aria-disabled="true">' + inner + '</div>';
        }).join('');

        observeReveal(grid);
        $$('.reveal', grid).forEach(function (card, i) {
            card.style.transitionDelay = (i * 110) + 'ms';
        });
        $$('.project-card', grid).forEach(attachCardTilt);

        // Filter buttons
        var filterBtns = $$('.filter-btn');
        var projectCards = $$('.project-card[data-category]', grid);
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.getAttribute('data-filter');
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                projectCards.forEach(function (card) {
                    var match = filter === 'all' || card.getAttribute('data-category') === filter;
                    card.style.display = match ? '' : 'none';
                });
            });
        });
    }

    /* ---------- Testimonials Slider ---------- */
    function renderTestimonials(testimonials) {
        var track = $('#testimonialsTrack');
        var dotsWrap = $('#testDots');
        var prev = $('#testPrev');
        var next = $('#testNext');
        if (!track || !testimonials || !testimonials.length) return;

        track.innerHTML = testimonials.map(function (t, i) {
            var stars = '';
            for (var s = 0; s < (t.rating || 5); s++) stars += '★';
            return ''
                + '<div class="testimonial-slide' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">'
                +   '<div class="testimonial-quote-mark">&ldquo;</div>'
                +   '<div class="testimonial-stars">' + stars + '</div>'
                +   '<p class="testimonial-text">' + escapeHTML(t.quote) + '</p>'
                +   '<div class="testimonial-author">'
                +     '<img class="testimonial-avatar" src="' + escapeHTML(t.avatar) + '" alt="' + escapeHTML(t.name) + '" loading="lazy">'
                +     '<div>'
                +       '<div class="testimonial-name">' + escapeHTML(t.name) + '</div>'
                +       '<div class="testimonial-role">' + escapeHTML(t.role) + '</div>'
                +     '</div>'
                +   '</div>'
                + '</div>';
        }).join('');

        dotsWrap.innerHTML = testimonials.map(function (_, i) {
            return '<button class="testimonials-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" aria-label="Go to testimonial ' + (i + 1) + '"></button>';
        }).join('');

        var slides = $$('.testimonial-slide', track);
        var dots = $$('.testimonials-dot', dotsWrap);
        var current = 0;
        var autoTimer;

        function go(idx) {
            var prev = current;
            current = (idx + slides.length) % slides.length;
            if (prev !== current) {
                // Outgoing slide exits to the right
                slides[prev].classList.add('exit-right');
                slides[prev].classList.remove('active');
            }
            slides.forEach(function (s, i) {
                if (i !== prev) s.classList.remove('exit-right');
                s.classList.toggle('active', i === current);
            });
            dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
        }
        function startAuto() { stopAuto(); autoTimer = setInterval(function () { go(current + 1); }, 6000); }
        function stopAuto() { if (autoTimer) clearInterval(autoTimer); }

        if (prev) prev.addEventListener('click', function () { go(current - 1); startAuto(); });
        if (next) next.addEventListener('click', function () { go(current + 1); startAuto(); });
        dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.dataset.idx); startAuto(); }); });

        var slider = $('.testimonials-slider');
        if (slider) {
            slider.addEventListener('mouseenter', stopAuto);
            slider.addEventListener('mouseleave', startAuto);
        }
        startAuto();
    }

    /* ---------- Project Detail Page ---------- */
    function renderProjectDetail(data) {
        if (!$('#pdTitle')) return; // not on detail page
        var projects = data.projects || [];
        var id = getQueryParam('id');
        var idx = 0;
        if (id) {
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].id === id) { idx = i; break; }
            }
        }
        var p = projects[idx];
        if (!p) return;
        var d = p.detail || {};

        document.title = p.title + ' — Wisepath Case Study';
        $('#pdTitle').innerHTML = escapeHTML(p.title);
        $('#pdSubtitle').textContent = d.subtitle || p.description || '';
        $('#pdHeroImage').src = d.heroImage || p.image;
        $('#pdHeroImage').alt = p.imageAlt || p.title;

        $('#pdMeta').innerHTML = ''
            + '<div class="project-meta-item"><div class="project-meta-label">Client</div><div class="project-meta-value">' + escapeHTML(d.client || '—') + '</div></div>'
            + '<div class="project-meta-item"><div class="project-meta-label">Timeline</div><div class="project-meta-value">' + escapeHTML(d.timeline || '—') + '</div></div>'
            + '<div class="project-meta-item"><div class="project-meta-label">Category</div><div class="project-meta-value">' + escapeHTML(d.categoryFull || p.categoryLabel || '—') + '</div></div>'
            + '<div class="project-meta-item"><div class="project-meta-label">Year</div><div class="project-meta-value">' + escapeHTML(d.year || '—') + '</div></div>';

        function paragraphs(arr) {
            return (arr || []).map(function (t) { return '<p>' + escapeHTML(t) + '</p>'; }).join('');
        }
        $('#pdChallenge').innerHTML = paragraphs(d.challenge);
        $('#pdSolution').innerHTML = paragraphs(d.solution);

        $('#pdResultsIntro').textContent = d.resultsIntro || '';
        $('#pdResults').innerHTML = (d.results || []).map(function (r) {
            return '<div class="glass-card project-result-card">'
                +   '<div class="project-result-number">' + escapeHTML(r.value) + '</div>'
                +   '<div class="project-result-label">' + escapeHTML(r.label) + '</div>'
                + '</div>';
        }).join('');

        $('#pdTechIntro').textContent = d.techStackIntro || '';
        $('#pdTech').innerHTML = (d.techStack || []).map(function (t) {
            return '<span class="project-card-tag">' + escapeHTML(t) + '</span>';
        }).join('');

        $('#pdGallery').innerHTML = (d.gallery || []).map(function (g) {
            return '<img src="' + escapeHTML(g.src) + '" alt="' + escapeHTML(g.alt || '') + '" loading="lazy">';
        }).join('');

        // Prev / Next
        var prev = projects[(idx - 1 + projects.length) % projects.length];
        var next = projects[(idx + 1) % projects.length];
        $('#pdNav').innerHTML = ''
            + '<a href="project-detail.html?id=' + encodeURIComponent(prev.id) + '" class="project-nav-link">'
            +   '<span class="project-nav-label">← Previous</span>'
            +   '<span class="project-nav-title">' + escapeHTML(prev.title) + '</span>'
            + '</a>'
            + '<a href="project-detail.html?id=' + encodeURIComponent(next.id) + '" class="project-nav-link project-nav-link--next">'
            +   '<span class="project-nav-label">Next →</span>'
            +   '<span class="project-nav-title">' + escapeHTML(next.title) + '</span>'
            + '</a>';

        observeReveal();
        initSidebarActive();
    }

    /* ---------- Boot ---------- */
    fetch(DATA_URL, { cache: 'no-store' })
        .then(function (r) {
            if (!r.ok) throw new Error('Failed to load ' + DATA_URL);
            return r.json();
        })
        .then(function (data) {
            var cfg = data.config || {};
            renderServices(data.services);
            renderProjects(data.projects, cfg.projectsClickable !== false);
            renderTestimonials(data.testimonials);
            renderProjectDetail(data);
        })
        .catch(function (err) {
            console.error('[Wisepath] Data load error:', err);
        });

})();
