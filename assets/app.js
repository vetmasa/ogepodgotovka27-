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
