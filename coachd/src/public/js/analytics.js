// ─── PLACEHOLDER CONFIG ──────────────────────────────────────────────────────
var GA4_MEASUREMENT_ID = 'G-LP3FEVTPF1';   // Google Analytics 4
var CLARITY_PROJECT_ID = 'w2iv6bv2l1';     // Microsoft Clarity
// ─────────────────────────────────────────────────────────────────────────────

// ── Microsoft Clarity ────────────────────────────────────────────────────────
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1;
  t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);

// ── Google Analytics 4 ───────────────────────────────────────────────────────
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
  document.head.appendChild(s);
})();

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', GA4_MEASUREMENT_ID);

// ── Event helper ─────────────────────────────────────────────────────────────
window.coachd = window.coachd || {};
window.coachd.track = function (eventName, params) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params || {});
  }
  if (typeof clarity === 'function') {
    clarity('event', eventName);
  }
};

// ── Auto-wire events on DOM ready ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // CTA: Start Training / Start Free Week (any /signup link)
  document.querySelectorAll('a[href="/signup"]').forEach(function (el) {
    el.addEventListener('click', function () {
      var label = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
      window.coachd.track('cta_click', { cta_label: label, destination: 'signup' });
    });
  });

  // CTA: See a sample plan (demo dashboard link)
  document.querySelectorAll('a[href*="demo=true"]').forEach(function (el) {
    el.addEventListener('click', function () {
      window.coachd.track('cta_click', { cta_label: 'see_sample_plan', destination: 'demo_dashboard' });
    });
  });

  // Demo dashboard visit
  if (window.location.pathname === '/dashboard' && window.location.search.indexOf('demo=true') !== -1) {
    window.coachd.track('demo_dashboard_visit');
  }

  // Scroll depth — homepage only
  if (window.location.pathname === '/') {
    var depths = [25, 50, 75, 90];
    var fired = {};
    window.addEventListener('scroll', function () {
      var scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
      depths.forEach(function (d) {
        if (scrolled >= d && !fired[d]) {
          fired[d] = true;
          window.coachd.track('scroll_depth', { percent: d });
        }
      });
    }, { passive: true });
  }

});
