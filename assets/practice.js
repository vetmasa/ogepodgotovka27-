/* ==========================================================================
   ОГЭ-2027 · Русский язык — тренажёр по заданиям 2–12
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.PRACTICE_DATA;
  var VIDEO = window.PRACTICE_VIDEO || {};
  var questionText = document.getElementById('questionText');
  if (!DATA || !questionText) return;

  var STORE = 'oge2027-practice-v1';
  var taskSelect = document.getElementById('taskSelect');
  var qCounter = document.getElementById('qCounter');
  var optionsBox = document.getElementById('options');
  var hintText = document.getElementById('hintText');
  var feedback = document.getElementById('feedback');
  var progressBar = document.getElementById('progressBar');
  var practiceStats = document.getElementById('practiceStats');
  var qGrid = document.getElementById('qGrid');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var checkBtn = document.getElementById('checkBtn');
  var hintBtn = document.getElementById('hintBtn');
  var videoBtn = document.getElementById('videoBtn');
  var videoLabel = document.getElementById('videoLabel');
  var resetBtn = document.getElementById('resetBtn');

  var currentTask = '2';
  var currentIndex = 0;

  function byId(id) { return document.getElementById(id); }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (!raw || typeof raw !== 'object') raw = {};
      return { results: raw.results || {}, selected: raw.selected || {} };
    } catch (err) {
      return { results: {}, selected: {} };
    }
  }

  var state = loadState();

  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (err) {}
  }

  function questions(task) { return DATA[task] || []; }

  function ensure(task) {
    var count = questions(task).length;
    if (!Array.isArray(state.results[task]) || state.results[task].length !== count) {
      state.results[task] = Array.apply(null, Array(count)).map(function () { return null; });
    }
    if (!Array.isArray(state.selected[task])) state.selected[task] = [];
    while (state.selected[task].length < count) state.selected[task].push([]);
    state.selected[task] = state.selected[task].map(function (value) {
      return Array.isArray(value) ? value : [];
    });
  }

  function sorted(values) {
    return values.slice().sort(function (a, b) { return a - b; });
  }

  function readSelection() {
    var values = [];
    optionsBox.querySelectorAll('input:checked').forEach(function (input) {
      values.push(parseInt(input.value, 10));
    });
    ensure(currentTask);
    state.selected[currentTask][currentIndex] = sorted(values);
    saveState();
    return sorted(values);
  }

  function showFeedback(ok, question) {
    var right = question.answer.map(function (i) { return question.options[i]; }).join('; ');
    feedback.hidden = false;
    feedback.className = 'feedback ' + (ok ? 'ok' : 'bad');
    feedback.textContent = ok
      ? 'Правильно. ' + question.hint
      : 'Неверно. Правильный ответ: ' + right + '. ' + question.hint;
  }

  function updateStats() {
    var results = state.results[currentTask] || [];
    var answered = 0;
    var correct = 0;
    results.forEach(function (value) {
      if (value === true || value === false) answered++;
      if (value === true) correct++;
    });
    var total = results.length || 50;
    progressBar.style.width = (answered / total * 100) + '%';
    practiceStats.textContent = 'Отвечено: ' + answered + ' из ' + total + ' · Верно: ' + correct;
  }

  function renderGrid() {
    var list = questions(currentTask);
    qGrid.innerHTML = '';
    list.forEach(function (question, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'q-btn';
      btn.textContent = String(index + 1);
      var result = state.results[currentTask][index];
      if (result === true) btn.classList.add('correct');
      if (result === false) btn.classList.add('wrong');
      if (index === currentIndex) btn.classList.add('current');
      btn.setAttribute('aria-label', 'Перейти к вопросу ' + (index + 1));
      btn.addEventListener('click', function () {
        currentIndex = index;
        render();
      });
      qGrid.appendChild(btn);
    });
  }

  function render() {
    ensure(currentTask);
    var list = questions(currentTask);
    var question = list[currentIndex];
    if (!question) return;

    qCounter.textContent = '№ ' + (currentIndex + 1) + ' из ' + list.length;
    questionText.textContent = question.q;
    optionsBox.innerHTML = '';

    var chosen = state.selected[currentTask][currentIndex] || [];
    var result = state.results[currentTask][currentIndex];

    question.options.forEach(function (option, index) {
      var label = document.createElement('label');
      label.className = 'answer-option';

      var input = document.createElement('input');
      input.type = question.type === 'multi' ? 'checkbox' : 'radio';
      input.name = 'practice-answer';
      input.value = String(index);
      input.checked = chosen.indexOf(index) !== -1;
      if (result === true || result === false) input.disabled = true;

      var isRight = question.answer.indexOf(index) !== -1;
      if (result === true || result === false) {
        if (isRight) label.classList.add('correct');
        if (input.checked && !isRight) label.classList.add('wrong');
      }

      input.addEventListener('change', readSelection);

      var text = document.createElement('span');
      text.textContent = option;
      label.appendChild(input);
      label.appendChild(text);
      optionsBox.appendChild(label);
    });

    hintText.textContent = question.hint;
    hintText.hidden = true;

    if (result === true || result === false) {
      showFeedback(result === true, question);
    } else {
      feedback.hidden = true;
      feedback.textContent = '';
      feedback.className = 'feedback';
    }

    var video = VIDEO[currentTask];
    if (videoLabel) videoLabel.textContent = video ? video.title : '';
    if (videoBtn) videoBtn.disabled = !video;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === list.length - 1;
    updateStats();
    renderGrid();
  }

  function check() {
    var list = questions(currentTask);
    var question = list[currentIndex];
    if (!question) return;
    var already = state.results[currentTask][currentIndex];
    if (already === true || already === false) return;

    var selected = readSelection();
    if (!selected.length) {
      feedback.hidden = false;
      feedback.className = 'feedback bad';
      feedback.textContent = 'Выберите хотя бы один вариант ответа.';
      return;
    }
    var ok = JSON.stringify(selected) === JSON.stringify(sorted(question.answer));
    state.results[currentTask][currentIndex] = ok;
    saveState();
    render();
  }

  var requested = new URLSearchParams(location.search).get('task');
  if (requested && DATA[requested]) {
    currentTask = requested;
    taskSelect.value = requested;
  }

  taskSelect.addEventListener('change', function () {
    currentTask = this.value;
    currentIndex = 0;
    render();
  });

  prevBtn.addEventListener('click', function () {
    if (currentIndex > 0) { currentIndex--; render(); }
  });

  nextBtn.addEventListener('click', function () {
    if (currentIndex < questions(currentTask).length - 1) { currentIndex++; render(); }
  });

  checkBtn.addEventListener('click', check);

  hintBtn.addEventListener('click', function () {
    hintText.hidden = !hintText.hidden;
  });

  if (videoBtn) videoBtn.addEventListener('click', function () {
    var video = VIDEO[currentTask];
    if (video && video.url) window.open(video.url, '_blank', 'noopener');
  });

  resetBtn.addEventListener('click', function () {
    if (!confirm('Сбросить ответы и прогресс по заданию ' + currentTask + '?')) return;
    var count = questions(currentTask).length;
    state.results[currentTask] = Array.apply(null, Array(count)).map(function () { return null; });
    state.selected[currentTask] = Array.apply(null, Array(count)).map(function () { return []; });
    saveState();
    render();
  });

  render();
})();
