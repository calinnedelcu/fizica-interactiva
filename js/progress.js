// Progress tracking system — saved to localStorage
const Progress = {
  KEY: 'fizica_progress',

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch { return {}; }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  // Mark a section as read/completed
  completeSection(moduleId, sectionId) {
    const data = this.load();
    if (!data[moduleId]) data[moduleId] = { sections: {}, quizScore: null };
    data[moduleId].sections[sectionId] = true;
    this.save(data);
    this.updateUI();
  },

  // Save quiz score
  saveQuizScore(moduleId, score, total) {
    const data = this.load();
    if (!data[moduleId]) data[moduleId] = { sections: {}, quizScore: null };
    data[moduleId].quizScore = { score, total, date: Date.now() };
    this.save(data);
    this.updateUI();
  },

  // Get module progress percentage
  getModuleProgress(moduleId, totalSections) {
    const data = this.load();
    if (!data[moduleId]) return 0;
    const completed = Object.keys(data[moduleId].sections || {}).length;
    return Math.round((completed / totalSections) * 100);
  },

  // Get overall progress
  getOverallProgress(moduleSections) {
    let total = 0, completed = 0;
    const data = this.load();
    for (const [modId, sections] of Object.entries(moduleSections)) {
      total += sections;
      if (data[modId]) {
        completed += Object.keys(data[modId].sections || {}).length;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  },

  // Update sidebar checkmarks and progress bars
  updateUI() {
    const data = this.load();

    // Update sidebar links
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
      const moduleId = link.closest('[data-module-id]')?.dataset.moduleId;
      const sectionId = link.dataset.section;
      if (moduleId && data[moduleId]?.sections?.[sectionId]) {
        link.classList.add('completed');
        const check = link.querySelector('.check');
        if (check) check.textContent = '\u2713';
      }
    });

    // Update module progress bars on index page
    document.querySelectorAll('.module-card[data-mod]').forEach(card => {
      const modId = 'm' + card.dataset.mod;
      const total = parseInt(card.dataset.totalSections) || 1;
      const pct = this.getModuleProgress(modId, total);
      const fill = card.querySelector('.module-progress-fill');
      if (fill) fill.style.width = pct + '%';
    });

    // Update global stats
    const overallEl = document.getElementById('overallProgress');
    if (overallEl) {
      const pct = this.getOverallProgress({ m1: 8, m2: 8, m3: 8, m4: 10 });
      overallEl.textContent = pct + '%';
    }
  },

  // Reset all progress
  reset() {
    localStorage.removeItem(this.KEY);
    this.updateUI();
  }
};

// Auto-track section visibility with IntersectionObserver
function initSectionTracking(moduleId) {
  const sections = document.querySelectorAll('.section[id]');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        Progress.completeSection(moduleId, entry.target.id);

        // Also update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

// Scroll progress bar
function initScrollProgress() {
  const bar = document.querySelector('.progress-bar-top');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  });
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  Progress.updateUI();
  initScrollProgress();

  const moduleEl = document.querySelector('[data-module-id]');
  if (moduleEl) {
    initSectionTracking(moduleEl.dataset.moduleId);
  }
});
