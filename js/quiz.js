// Interactive Quiz System
class Quiz {
  constructor(containerId, questions, moduleColor = 'var(--accent)') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.questions = questions;
    this.current = 0;
    this.score = 0;
    this.answers = new Array(questions.length).fill(null);
    this.moduleColor = moduleColor;
    this.render();
  }

  render() {
    const total = this.questions.length;
    let html = `
      <div class="quiz-header">
        <h3>Quiz Interactiv</h3>
        <div class="quiz-score" id="${this.container.id}-score">0 / ${total}</div>
      </div>
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" id="${this.container.id}-progress"></div>
      </div>
      <div class="quiz-body" id="${this.container.id}-body">
    `;

    this.questions.forEach((q, i) => {
      html += `<div class="question${i === 0 ? ' active' : ''}" data-qi="${i}">`;
      html += `<div class="question-num">Intrebarea ${i + 1} din ${total}</div>`;
      html += `<div class="question-text">${q.text}</div>`;

      if (q.type === 'mc') {
        html += this.renderMC(q, i);
      } else if (q.type === 'numeric') {
        html += this.renderNumeric(q, i);
      }

      // Hints
      if (q.hints && q.hints.length) {
        html += `<div class="hints-area" data-qi="${i}">`;
        q.hints.forEach((hint, hi) => {
          html += `<button class="hint-btn" onclick="quizInstances['${this.container.id}'].showHint(${i},${hi})">
            ${hi === 0 ? 'Indiciu' : hi === 1 ? 'Formula' : 'Pas rezolvare'}
          </button>`;
          html += `<div class="hint-box" id="${this.container.id}-hint-${i}-${hi}">${hint}</div>`;
        });
        html += `</div>`;
      }

      // Feedback area
      html += `<div class="feedback" id="${this.container.id}-fb-${i}"></div>`;

      // Solution
      if (q.solution) {
        html += `<button class="show-solution-btn" onclick="quizInstances['${this.container.id}'].showSolution(${i})">Arata solutia completa</button>`;
        html += `<div class="solution" id="${this.container.id}-sol-${i}">
          <div class="solution-content">${q.solution}</div>
        </div>`;
      }

      html += `</div>`;
    });

    html += `</div>`;

    // Results
    html += `<div class="quiz-results" id="${this.container.id}-results">
      <div class="results-score" id="${this.container.id}-final-score"></div>
      <div class="results-text" id="${this.container.id}-final-text"></div>
      <div class="results-bar"><div class="results-bar-fill" id="${this.container.id}-final-bar"></div></div>
      <button class="retry-btn" onclick="quizInstances['${this.container.id}'].retry()">Incearca din nou</button>
    </div>`;

    // Navigation
    html += `<div class="quiz-nav">
      <button class="quiz-btn quiz-btn-prev" id="${this.container.id}-prev" onclick="quizInstances['${this.container.id}'].prev()" disabled>&larr; Inapoi</button>
      <button class="quiz-btn quiz-btn-next" id="${this.container.id}-next" onclick="quizInstances['${this.container.id}'].next()">Urmatoarea &rarr;</button>
    </div>`;

    this.container.innerHTML = html;

    // Re-render math
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(this.container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  renderMC(q, qi) {
    const letters = ['A', 'B', 'C', 'D'];
    let html = '<div class="mc-options">';
    q.options.forEach((opt, oi) => {
      html += `<div class="mc-option" data-qi="${qi}" data-oi="${oi}"
        onclick="quizInstances['${this.container.id}'].answerMC(${qi},${oi})">
        <span class="mc-letter">${letters[oi]}</span>
        <span>${opt}</span>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  renderNumeric(q, qi) {
    return `<div class="numeric-input-group">
      <input type="number" class="numeric-input" id="${this.container.id}-input-${qi}"
        placeholder="Raspunsul tau..." step="any"
        onkeydown="if(event.key==='Enter')quizInstances['${this.container.id}'].answerNumeric(${qi})">
      <span class="numeric-unit">${q.unit || ''}</span>
      <button class="check-btn" onclick="quizInstances['${this.container.id}'].answerNumeric(${qi})">Verifica</button>
    </div>`;
  }

  answerMC(qi, oi) {
    if (this.answers[qi] !== null) return; // already answered
    this.answers[qi] = oi;
    const q = this.questions[qi];
    const options = this.container.querySelectorAll(`.mc-option[data-qi="${qi}"]`);

    options.forEach(opt => {
      opt.classList.add('disabled');
      const idx = parseInt(opt.dataset.oi);
      if (idx === q.correct) {
        opt.classList.add('correct');
      } else if (idx === oi && idx !== q.correct) {
        opt.classList.add('wrong');
      }
    });

    const isCorrect = oi === q.correct;
    if (isCorrect) this.score++;
    this.showFeedback(qi, isCorrect, q.explanation);
    this.updateScore();
  }

  answerNumeric(qi) {
    if (this.answers[qi] !== null) return;
    const input = document.getElementById(`${this.container.id}-input-${qi}`);
    const val = parseFloat(input.value);
    if (isNaN(val)) return;

    const q = this.questions[qi];
    const tolerance = q.tolerance || 0.02;
    const isCorrect = Math.abs(val - q.correct) <= Math.abs(q.correct * tolerance) + 0.001;

    this.answers[qi] = val;
    input.classList.add(isCorrect ? 'correct' : 'wrong');
    input.disabled = true;
    this.container.querySelector(`.check-btn`)?.setAttribute('disabled', true);

    if (isCorrect) this.score++;
    this.showFeedback(qi, isCorrect, q.explanation);
    this.updateScore();
  }

  showFeedback(qi, isCorrect, explanation) {
    const fb = document.getElementById(`${this.container.id}-fb-${qi}`);
    fb.className = `feedback visible ${isCorrect ? 'correct' : 'wrong'}`;
    if (isCorrect) {
      fb.textContent = 'Corect! ' + (explanation || '');
    } else {
      fb.textContent = 'Gresit. ' + (explanation || '');
    }
  }

  showHint(qi, hi) {
    const hintBox = document.getElementById(`${this.container.id}-hint-${qi}-${hi}`);
    hintBox.classList.toggle('visible');
    // Re-render math in hint
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(hintBox, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  showSolution(qi) {
    const sol = document.getElementById(`${this.container.id}-sol-${qi}`);
    sol.classList.toggle('visible');
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(sol, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  updateScore() {
    const scoreEl = document.getElementById(`${this.container.id}-score`);
    scoreEl.textContent = `${this.score} / ${this.questions.length}`;
    const progressEl = document.getElementById(`${this.container.id}-progress`);
    const answered = this.answers.filter(a => a !== null).length;
    progressEl.style.width = (answered / this.questions.length * 100) + '%';
  }

  next() {
    if (this.current < this.questions.length - 1) {
      this.showQuestion(this.current + 1);
    } else {
      this.showResults();
    }
  }

  prev() {
    if (this.current > 0) {
      this.showQuestion(this.current - 1);
    }
  }

  showQuestion(idx) {
    this.container.querySelectorAll('.question').forEach(q => q.classList.remove('active'));
    this.container.querySelector(`.question[data-qi="${idx}"]`).classList.add('active');
    this.current = idx;

    const prevBtn = document.getElementById(`${this.container.id}-prev`);
    const nextBtn = document.getElementById(`${this.container.id}-next`);
    prevBtn.disabled = idx === 0;
    nextBtn.textContent = idx === this.questions.length - 1 ? 'Vezi rezultate' : 'Urmatoarea \u2192';
  }

  showResults() {
    this.container.querySelector('.quiz-body').style.display = 'none';
    this.container.querySelector('.quiz-nav').style.display = 'none';
    const results = document.getElementById(`${this.container.id}-results`);
    results.classList.add('visible');

    const pct = Math.round(this.score / this.questions.length * 100);
    document.getElementById(`${this.container.id}-final-score`).textContent = `${this.score} / ${this.questions.length}`;

    let text = '';
    if (pct >= 90) text = 'Excelent! Stapanesti materia foarte bine!';
    else if (pct >= 70) text = 'Bine! Mai repeta cateva concepte si vei fi pregatit.';
    else if (pct >= 50) text = 'Destul de bine, dar mai e loc de imbunatatire.';
    else text = 'Mai repeta teoria si incearca din nou. Nu te descuraja!';
    document.getElementById(`${this.container.id}-final-text`).textContent = text;

    const bar = document.getElementById(`${this.container.id}-final-bar`);
    bar.style.background = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
    setTimeout(() => { bar.style.width = pct + '%'; }, 100);

    // Save to progress
    const moduleEl = document.querySelector('[data-module-id]');
    if (moduleEl) {
      Progress.saveQuizScore(moduleEl.dataset.moduleId, this.score, this.questions.length);
    }
  }

  retry() {
    this.current = 0;
    this.score = 0;
    this.answers = new Array(this.questions.length).fill(null);
    this.render();
  }
}

// Global registry for quiz instances (needed for onclick handlers)
const quizInstances = {};

// Step-by-step exercise reveal
function initExercises() {
  document.querySelectorAll('.exercise').forEach(ex => {
    const steps = ex.querySelectorAll('.step');
    steps.forEach(step => {
      const header = step.querySelector('.step-header');
      if (header) {
        header.addEventListener('click', () => {
          step.classList.toggle('revealed');
        });
      }
    });

    const revealAllBtn = ex.querySelector('.reveal-all-btn');
    if (revealAllBtn) {
      revealAllBtn.addEventListener('click', () => {
        steps.forEach(s => s.classList.add('revealed'));
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', initExercises);
