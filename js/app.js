/* ============================================================
   AI/ML Depth Study Site — Core App Logic
   ============================================================ */

// ---- PROGRESS TRACKING (localStorage) ----
const PROGRESS_KEY = 'aiml_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}

function setTopicStatus(topicId, status) {
  const p = getProgress();
  p[topicId] = status;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  updateAllProgressUI();
}

function getTopicStatus(topicId) {
  return getProgress()[topicId] || 'not_started';
}

function updateAllProgressUI() {
  document.querySelectorAll('[data-topic-id]').forEach(el => {
    const id = el.dataset.topicId;
    const status = getTopicStatus(id);
    el.dataset.status = status;
  });
  updateProgressBars();
}

function updateProgressBars() {
  const p = getProgress();
  document.querySelectorAll('[data-pillar-progress]').forEach(el => {
    const pillar = el.dataset.pillarProgress;
    const topics = window.PILLAR_TOPICS?.[pillar] || [];
    if (!topics.length) return;
    const done = topics.filter(t => ['reviewing','mastered'].includes(p[t])).length;
    const pct = Math.round((done / topics.length) * 100);
    el.textContent = pct + '%';
    const ring = document.querySelector(`[data-pillar-ring="${pillar}"]`);
    if (ring) {
      const r = 20, circ = 2 * Math.PI * r;
      ring.style.strokeDasharray = circ;
      ring.style.strokeDashoffset = circ - (circ * pct / 100);
    }
  });
}

// ---- SEARCH ----
const SEARCH_INDEX = [];

function buildSearchIndex(topics) {
  SEARCH_INDEX.length = 0;
  topics.forEach(t => SEARCH_INDEX.push(t));
}

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.getElementById('search-input-big')?.focus();
}

function closeSearch() {
  document.getElementById('search-overlay')?.classList.remove('open');
}

function runSearch(q) {
  const results = document.getElementById('search-results');
  if (!results) return;
  if (!q.trim()) { results.innerHTML = ''; return; }
  const hits = SEARCH_INDEX.filter(t =>
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 10);
  results.innerHTML = hits.map(t => `
    <a href="${t.url}" class="search-result-item" onclick="closeSearch()">
      <span class="sr-pillar">${t.pillar}</span>
      <span class="sr-title">${t.title}</span>
    </a>
  `).join('') || '<p style="padding:16px;color:var(--text-muted);font-size:.875rem;">No results found.</p>';
}

// ---- Q&A TOGGLE ----
function initQA() {
  document.querySelectorAll('.qa-question').forEach(q => {
    q.addEventListener('click', () => {
      const ans = q.nextElementSibling;
      if (ans?.classList.contains('qa-answer')) {
        ans.classList.toggle('open');
        const icon = q.querySelector('.qa-toggle');
        if (icon) icon.textContent = ans.classList.contains('open') ? '▲' : '▼';
      }
    });
  });
}

// ---- MARK BUTTON ----
function initMarkButtons() {
  document.querySelectorAll('.mark-btn').forEach(btn => {
    const topicId = btn.dataset.topicId;
    if (!topicId) return;
    const status = getTopicStatus(topicId);
    if (status === 'mastered') {
      btn.classList.add('mastered');
      btn.innerHTML = '✓ Mastered';
    }
    btn.addEventListener('click', () => {
      const current = getTopicStatus(topicId);
      const next = current === 'mastered' ? 'not_started' : 'mastered';
      setTopicStatus(topicId, next);
      btn.classList.toggle('mastered', next === 'mastered');
      btn.innerHTML = next === 'mastered' ? '✓ Mastered' : 'Mark as Mastered';
    });
  });
}

// ---- ACTIVE NAV LINK ----
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active',
      a.getAttribute('href') && path.includes(a.getAttribute('href').replace('./', '').replace('.html',''))
    );
  });
}

// ---- SIDEBAR SCROLL SPY ----
function initScrollSpy() {
  const sections = document.querySelectorAll('.depth-section[id]');
  const links = document.querySelectorAll('.topic-sidebar a[href^="#"]');
  if (!sections.length || !links.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.topic-sidebar a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => io.observe(s));
}

// ---- KEYBOARD SHORTCUTS ----
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initQA();
  initMarkButtons();
  initScrollSpy();
  updateAllProgressUI();

  const overlay = document.getElementById('search-overlay');
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });

  const bigInput = document.getElementById('search-input-big');
  bigInput?.addEventListener('input', e => runSearch(e.target.value));

  const navInput = document.querySelector('.nav-search input');
  navInput?.addEventListener('focus', () => { openSearch(); bigInput?.focus(); });

  // build search index from global TOPICS if defined
  if (window.TOPICS) buildSearchIndex(window.TOPICS);
});
