/* ============================================================
   Wisepath v2 — Main JavaScript
   Zero dependencies • Vanilla ES6+
   ============================================================ */

(function () {
    'use strict';

    /* ----------------------------------------------------------
       1. Navigation — scroll state & mobile toggle
       ---------------------------------------------------------- */
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Sticky background on scroll
    function handleNavScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // Mobile menu
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ----------------------------------------------------------
       2. Scroll-reveal (Intersection Observer)
       ---------------------------------------------------------- */
    var revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(function (el) { observer.observe(el); });
    } else {
        // Fallback: show everything
        revealElements.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ----------------------------------------------------------
       3. Project filter buttons
       ---------------------------------------------------------- */
    var filterBtns = document.querySelectorAll('.filter-btn');
    var projectCards = document.querySelectorAll('.project-card[data-category]');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var filter = btn.getAttribute('data-filter');

            // Active state
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            // Filter
            projectCards.forEach(function (card) {
                var match = filter === 'all' || card.getAttribute('data-category') === filter;
                card.style.display = match ? '' : 'none';
            });
        });
    });

    /* ----------------------------------------------------------
       4. Project detail — sidebar active link on scroll
       ---------------------------------------------------------- */
    var sidebarLinks = document.querySelectorAll('.project-sidebar-link');
    if (sidebarLinks.length) {
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
       5. Contact form (basic client-side handling)
       ---------------------------------------------------------- */
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = contactForm.querySelector('button[type="submit"]');
            var originalText = btn.innerHTML;
            btn.innerHTML = 'Sent! ✓';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            setTimeout(function () {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '';
                contactForm.reset();
            }, 2500);
        });
    }

    /* ----------------------------------------------------------
       6. Smooth scroll for anchor links
       ---------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var offset = nav ? nav.offsetHeight + 16 : 0;
                var top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    /* ----------------------------------------------------------
       7. Scroll progress bar
       ---------------------------------------------------------- */
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0) progressBar.style.width = (window.scrollY / max * 100) + '%';
    }, { passive: true });

    /* ----------------------------------------------------------
       8. Cursor glow — desktop only
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
            cursorGlow.style.top  = gy + 'px';
            requestAnimationFrame(animGlow);
        })();
    }

    /* ----------------------------------------------------------
       9. Parallax — hero background + hero image + about image
       ---------------------------------------------------------- */
    var heroBg      = document.getElementById('heroBg');
    var heroImgWrap = document.querySelector('.hero-image-wrap');
    var aboutImgEl  = document.querySelector('.about-image');

    window.addEventListener('scroll', function () {
        var sy = window.scrollY;

        // Background slides down at 38% of scroll speed → foreground
        // content scrolls away faster, creating clear depth separation
        if (heroBg) {
            heroBg.style.transform = 'translateY(' + (sy * 0.38) + 'px)';
        }

        // Hero image (right column) moves slightly faster than bg
        if (heroImgWrap) {
            heroImgWrap.style.transform = 'translateY(' + (sy * 0.12) + 'px)';
        }

        // About image — subtle parallax when in view
        if (aboutImgEl) {
            var rect = aboutImgEl.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                aboutImgEl.style.transform = 'translateY(' + ((rect.top - window.innerHeight * 0.5) * -0.08) + 'px)';
            }
        }
    }, { passive: true });

    /* ----------------------------------------------------------
       10. Stagger reveal delays for grid children
       ---------------------------------------------------------- */
    document.querySelectorAll('.services-grid, .projects-grid, .testimonials-grid').forEach(function (grid) {
        grid.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(function (card, i) {
            card.style.transitionDelay = (i * 110) + 'ms';
        });
    });

    /* ----------------------------------------------------------
       11. Animated stat counters
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

    if (statsSection && statEls.length) {
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
       12. Reveal-left / reveal-right intersection observer
       ---------------------------------------------------------- */
    var sideRevealEls = document.querySelectorAll('.reveal-left, .reveal-right');
    if ('IntersectionObserver' in window && sideRevealEls.length) {
        var sideObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    sideObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        sideRevealEls.forEach(function (el) { sideObs.observe(el); });
    } else {
        sideRevealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ----------------------------------------------------------
       13. Hero word flip
       ---------------------------------------------------------- */
    var flipEl    = document.querySelector('.hero-flip-word');
    var flipWords = ['forward', 'faster', 'smarter', 'further'];
    var flipIdx   = 0;

    if (flipEl) {
        setInterval(function () {
            flipEl.classList.add('flip-out');
            setTimeout(function () {
                flipIdx = (flipIdx + 1) % flipWords.length;
                flipEl.textContent = words[flipIdx];
                flipEl.classList.remove('flip-out');
                flipEl.classList.add('flip-in');
                flipEl.offsetHeight; // force reflow
                flipEl.classList.add('flip-show');
                setTimeout(function () { flipEl.classList.remove('flip-in', 'flip-show'); }, 380);
            }, 230);
        }, 3200);

        // Fix: use local reference
        var words = flipWords;
    }

    /* ----------------------------------------------------------
       14. 3-D tilt on project cards
       ---------------------------------------------------------- */
    document.querySelectorAll('.project-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var r  = card.getBoundingClientRect();
            var x  = (e.clientX - r.left) / r.width  - 0.5;
            var y  = (e.clientY - r.top)  / r.height - 0.5;
            card.style.transition = 'transform 0.08s';
            card.style.transform  = 'perspective(1000px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 7) + 'deg) scale(1.018)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transition = 'transform 0.55s var(--ease-out)';
            card.style.transform  = '';
        });
    });

    /* ----------------------------------------------------------
       15. Magnetic primary buttons
       ---------------------------------------------------------- */
    document.querySelectorAll('.btn-primary:not(.nav-cta)').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            var x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
            var y = ((e.clientY - r.top)  / r.height - 0.5) * 10;
            btn.style.transform = 'translateY(-2px) translate(' + x + 'px,' + y + 'px)';
        });
        btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });

    /* ----------------------------------------------------------
       16. Ambient floating particles (canvas)
       ---------------------------------------------------------- */
    var pcCanvas = document.createElement('canvas');
    pcCanvas.id  = 'particles-canvas';
    document.body.prepend(pcCanvas);
    var pcCtx = pcCanvas.getContext('2d');
    var pcList = [];

    function pcResize() { pcCanvas.width = window.innerWidth; pcCanvas.height = window.innerHeight; }
    pcResize();
    window.addEventListener('resize', pcResize, { passive: true });

    for (var pi = 0; pi < 60; pi++) {
        pcList.push({
            x:       Math.random() * pcCanvas.width,
            y:       Math.random() * pcCanvas.height,
            r:       Math.random() * 1.5 + 0.3,
            speed:   Math.random() * 0.38 + 0.07,
            opacity: Math.random() * 0.32 + 0.06,
            drift:   (Math.random() - 0.5) * 0.28,
            hue:     Math.random() > 0.4 ? '79,70,229' : '6,182,212'
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
