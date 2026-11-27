/* ==========================================================================
   ОГЭ-2027 · Русский язык — интерактив и режим редактирования
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Мобильное меню ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) nav.classList.remove('open');
    });
  }

  /* ---------- Переключатель светлой / тёмной темы ---------- */
  var THEME_KEY = 'oge2027-theme-v1';
  var rootEl = document.documentElement;

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; }
    catch (err) { return 'dark'; }
  }

  function applyTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var label = theme === 'dark' ? 'Светлая' : 'Тёмная';
    var hint = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
    btn.textContent = label;
    btn.setAttribute('title', hint);
    btn.setAttribute('aria-label', hint);
  }

  var headerInner = document.querySelector('.header-inner');
  if (headerInner && !document.querySelector('.theme-toggle')) {
    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'theme-toggle';
    headerInner.appendChild(themeBtn);
    themeBtn.addEventListener('click', function () {
      var next = storedTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
      applyTheme(next);
    });
  }
  applyTheme(storedTheme());

  /* Синхронизация темы между открытыми вкладками */
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY || e.key === null) applyTheme(storedTheme());
  });

  /* ---------- Подсветка текущей страницы ---------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function (a) {
    var href = a.getAttribute('href').split('/').pop() || 'index.html';
    if (href === here) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Фильтры (data-filter-group / data-filter) ---------- */
  var buttons = document.querySelectorAll('.filter-btn[data-filter]');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.getAttribute('data-filter-group') || '';
      var value = btn.getAttribute('data-filter') || 'all';
      var scope = group ? document.querySelector('[data-filter-group="' + group + '"]') : null;
      var container = document.querySelector('[data-filter-target="' + group + '"]') || document;

      document.querySelectorAll('.filter-btn[data-filter-group="' + group + '"]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });

      container.querySelectorAll('[data-tags]').forEach(function (item) {
        var tags = (item.getAttribute('data-tags') || '').split(/\s+/);
        var show = value === 'all' || tags.indexOf(value) !== -1;
        item.classList.toggle('hidden', !show);
      });
    });
  });

  /* ---------- Вкладки (data-tabs / data-tab / data-panel) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var buttons = root.querySelectorAll('[data-tab]');
    var panels = root.querySelectorAll('[data-panel]');
    if (!buttons.length || !panels.length) return;

    function select(name) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-tab') === name;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== name;
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { select(b.getAttribute('data-tab')); });
    });
    select(buttons[0].getAttribute('data-tab'));
  });

  /* ---------- Галочки выполнения заданий ---------- */
  var PROGRESS_KEY = 'oge2027-progress:' + here;
  var progressBoxes = document.querySelectorAll('[data-progress]');
  if (progressBoxes.length) {
    try {
      var savedProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      progressBoxes.forEach(function (box) {
        box.checked = !!savedProgress[box.getAttribute('data-progress')];
      });
    } catch (err) { /* локальное хранилище может быть недоступно */ }
    progressBoxes.forEach(function (box) {
      box.addEventListener('change', function () {
        var data = {};
        progressBoxes.forEach(function (item) {
          data[item.getAttribute('data-progress')] = item.checked;
        });
        try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)); } catch (err) {}
      });
    });
  }

  /* ---------- Режим редактирования ---------- */
  var STORAGE_KEY = 'oge2027-edits-v1';
  var editBar = document.getElementById('editBar');
  var body = document.body;

  function pageKey() { return STORAGE_KEY + ':' + here; }

  function applySavedEdits() {
    try {
      var saved = JSON.parse(localStorage.getItem(pageKey()) || '{}');
      Object.keys(saved).forEach(function (key) {
        var el = document.querySelector('[data-edit-id="' + key + '"]');
        if (el) el.innerHTML = saved[key];
      });
    } catch (err) { /* локальное хранилище может быть недоступно */ }
  }

  function saveEdits() {
    var data = {};
    document.querySelectorAll('[data-edit-id]').forEach(function (el) {
      data[el.getAttribute('data-edit-id')] = el.innerHTML;
    });
    try { localStorage.setItem(pageKey(), JSON.stringify(data)); } catch (err) {}
    var status = document.getElementById('editStatus');
    if (status) {
      status.textContent = 'Изменения сохранены в этом браузере';
      setTimeout(function () { status.textContent = ''; }, 2500);
    }
  }

  function setEditing(on) {
    body.classList.toggle('editing', on);
    document.querySelectorAll('[data-editable]').forEach(function (el) {
      el.contentEditable = on ? 'true' : 'false';
      el.spellcheck = true;
    });
    var btn = document.getElementById('editToggle');
    if (btn) btn.textContent = on ? 'Готово' : 'Редактировать';
    if (on) saveEdits();
  }

  applySavedEdits();

  var editToggle = document.getElementById('editToggle');
  if (editToggle) editToggle.addEventListener('click', function () {
    setEditing(!body.classList.contains('editing'));
  });

  var saveBtn = document.getElementById('editSave');
  if (saveBtn) saveBtn.addEventListener('click', saveEdits);

  var resetBtn = document.getElementById('editReset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('Вернуть исходный текст этой страницы? Локальные правки будут удалены.')) return;
    localStorage.removeItem(pageKey());
    location.reload();
  });

  var exportBtn = document.getElementById('editExport');
  if (exportBtn) exportBtn.addEventListener('click', function () {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-editable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
    clone.querySelectorAll('[data-progress]').forEach(function (box) {
      if (box.checked) box.setAttribute('checked', 'checked');
      else box.removeAttribute('checked');
    });
    clone.querySelectorAll('[data-tabs] [data-tab]').forEach(function (b) {
      b.setAttribute('aria-selected', b.classList.contains('is-active') ? 'true' : 'false');
    });
    clone.querySelectorAll('[data-panel]').forEach(function (p) {
      var active = document.querySelector('[data-tab].is-active[data-tab="' + p.getAttribute('data-panel') + '"]');
      if (active) p.removeAttribute('hidden');
      else p.setAttribute('hidden', 'hidden');
    });
    var bar = clone.querySelector('#editBar'); if (bar) bar.remove();
    var hint = clone.querySelector('.edit-hint'); if (hint) hint.remove();
    clone.querySelectorAll('.nav a').forEach(function (a) { a.classList.remove('active'); });
    var html = '<!doctype html>\n' + clone.outerHTML;
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = here.replace(/\.html$/, '') + '-edited.html';
    link.click();
    URL.revokeObjectURL(url);
  });

  if (editBar) editBar.style.display = 'flex';
})();
