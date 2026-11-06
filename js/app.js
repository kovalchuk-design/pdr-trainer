import {
  S, load, save, saveNow, loadData, DB, EXAM, status, counts, secStats, readiness, record, snapshot,
  streak, bestStreak, todayCount, dkey, addDays, examInfo, plural, explanation, pickSmart, pickSection,
  pickExam, pickMistakes, mistakeList, exportJSON, importJSON, resetState,
} from './core.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- іконки ----------
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z',
  topics: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4ZM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6Z',
  exam: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2.5 2.5M9 2h6',
  saved: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z',
  stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  x: 'M6 6l12 12M18 6 6 18', check: 'm5 12 5 5 9-10', play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z',
  list: 'M4 5h16M4 12h16M4 19h10', redo: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  back: 'M19 12H5M11 6l-6 6 6 6', next: 'M5 12h14M13 6l6 6-6 6', flag: 'M4 21V4h12l-1.5 4L16 12H4', bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z',
  zoom: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7', diamond: 'M12 2 2 12l10 10 10-10ZM12 8v5M12 16h.01', up: 'm5 15 7-7 7 7', chev: 'm9 6 6 6-6 6',
};
const ic = (n, s = 22, extra = '') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}><path d="${P[n]}"/></svg>`;
const flame = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#F59E0B" stroke="#B45309" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9Z"/></svg>`;

// ---------- тема ----------
function applyTheme() {
  const t = S.settings.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]')?.setAttribute('content', dark ? '#000000' : '#F3F5F9');
  return dark;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
const isDark = () => document.documentElement.dataset.theme === 'dark';

// ---------- тости та діалоги ----------
let toastT = 0;
function toast(msg) {
  $('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.append(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
}
function dialog(html, { cls = '' } = {}) {
  const d = document.createElement('dialog'); d.className = cls; d.innerHTML = html;
  document.body.append(d); d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.showModal(); return d;
}
function confirmBox(title, text, yes, no = 'Скасувати') {
  return new Promise((res) => {
    const d = dialog(`<div class="col" style="gap:14px"><h2 class="h2">${esc(title)}</h2><p class="muted">${esc(text)}</p>
      <div class="row" style="gap:10px;margin-top:6px"><button class="btn sec" style="flex:1" data-v="0">${esc(no)}</button><button class="btn" style="flex:1" data-v="1">${esc(yes)}</button></div></div>`);
    let v = false;
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { v = b.dataset.v === '1'; d.close(); } });
    d.addEventListener('close', () => res(v));
  });
}

// ---------- виведення ----------
let timerId = 0;
function setView(html, { focus = false, nav = '', wide = false } = {}) {
  clearInterval(timerId); clearTimeout(advT);
  document.body.classList.toggle('focus', focus);
  $('#side').style.display = focus ? 'none' : '';
  $('#tabs').style.display = focus ? 'none' : '';
  $('#view').innerHTML = focus ? html : `<div class="page${wide ? ' wide' : ''}">${html}</div>`;
  document.querySelectorAll('[data-nav]').forEach((a) => (nav && a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  scrollTo(0, 0);
}
const NAV = [['home', '#/', 'Головна'], ['topics', '#/topics', 'Теми'], ['exam', '#/exam', 'Іспит'], ['saved', '#/saved', 'Збережені'], ['stats', '#/stats', 'Прогрес']];
function mountShell() {
  $('#tabs').innerHTML = NAV.map(([k, h, l]) => `<a class="tab" href="${h}" data-nav="${k}">${ic(k, 24)}${l}</a>`).join('');
  $('#side').innerHTML = `<div class="brand"><i>${ic('diamond', 20)}</i>ПДР Тренажер</div>
    <nav class="col" style="gap:4px" aria-label="Основна навігація">${NAV.map(([k, h, l]) => `<a class="side-link" href="${h}" data-nav="${k}">${ic(k)}${l}</a>`).join('')}</nav>
    <div class="col" style="gap:4px;margin-top:auto"><a class="side-link" href="#/settings" data-nav="settings">${ic('gear')}Налаштування</a></div>`;
}

// ---------- допоміжне ----------
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
const fmtDur = (s) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? (m ? `${h}\u00a0год ${m}\u00a0хв` : `${h}\u00a0год`) : `${m}\u00a0хв`; };
const pct = (x) => `${Math.round(x * 100)}%`;
function tone(p) { return p >= 85 ? 'ok' : p < 65 ? 'err' : 'acc'; }
const toneVars = { ok: ['var(--ok-soft)', 'var(--ok-text)', 'var(--ok)'], err: ['var(--err-soft)', 'var(--err-text)', 'var(--err)'], acc: ['var(--accent-soft)', 'var(--accent-text)', 'var(--accent)'], mute: ['var(--chip)', 'var(--muted)', 'var(--bar-soft)'] };

// ---------- сесії ----------
function startSession(mode, ids, title) {
  if (!ids.length) { toast('Немає питань для цієї сесії'); return; }
  S.session = { mode, ids, picks: [], i: 0, start: Date.now(), qs: Date.now(), limit: mode === 'exam' ? EXAM.minutes * 60 : 0, pre: ids.map((id) => status(id)), title };
  saveNow(); location.hash = '#/session';
}
function activeSession() { return S.session && !S.session.done ? S.session : null; }

async function finishExam(auto = false) {
  const s = S.session; if (!s) return;
  const total = s.ids.length;
  let score = 0; const per = Math.max(5, Math.round((Date.now() - s.start) / 1000 / total));
  s.ids.forEach((id, i) => { const ok = s.picks[i] === DB.byId.get(id).a; if (ok) score++; record(id, ok, per); });
  const secs = Math.min(Math.round((Date.now() - s.start) / 1000), EXAM.minutes * 60);
  S.exams.push({ t: Date.now(), total, score, secs, ids: s.ids, picks: s.picks, pass: total - score <= EXAM.maxErrors, auto });
  S.session = null; snapshot(); saveNow();
  location.hash = `#/results/${S.exams.length - 1}`;
}
function finishLearn() {
  const s = S.session; if (!s) return;
  s.done = true;
  S.last = { t: Date.now(), ids: s.ids, picks: s.picks, secs: Math.round((Date.now() - s.start) / 1000), title: s.title, mode: 'learn' };
  S.session = null; snapshot(); saveNow(); location.hash = '#/done';
}

// ---------- екран питання ----------
function figHTML(q) {
  return q.i.map((src) => `<figure class="q-fig ${q.i.length > 1 ? 'small' : ''}"><img src="img/${src}" alt="Ілюстрація до питання" data-act="zoom"></figure>`).join('');
}
function optsHTML(q, { pick, reveal, lock }) {
  return q.o.map((text, idx) => {
    const k = idx + 1; let cls = 'opt', mark = String(k), tag = '';
    if (reveal) {
      if (k === q.a) { cls += ' good'; mark = ic('check', 16); tag = 'Правильна відповідь'; }
      else if (k === pick) { cls += ' bad'; mark = ic('x', 14); tag = 'Ваша відповідь'; }
      else cls += ' dim';
    } else if (k === pick) cls += ' sel';
    return `<button class="${cls}" data-act="pick" data-k="${k}" ${lock ? 'disabled' : ''}><span class="mark">${mark}</span><span>${esc(text)}${tag ? `<small>${tag}</small>` : ''}</span></button>`;
  }).join('');
}
function explainHTML(q) {
  const e = explanation(q.id);
  const flagged = S.flags[q.id];
  return `${e ? `<section class="explain" aria-label="Пояснення"><div class="row" style="gap:8px;color:var(--accent-text)">${ic('bulb', 20)}<h2 class="h2" style="color:var(--ink)">Чому так</h2></div>
      <p>${esc(e.e)}</p>${e.r?.length ? `<div class="refs">${e.r.map((r) => `<span class="chip acc">${esc(r)}</span>`).join('')}</div>` : ''}
      <p class="small muted">Неофіційне пояснення. Правильна відповідь — за офіційною таблицею ГСЦ МВС.</p></section>` : ''}
    <button class="link-btn" data-act="flag" data-id="${q.id}">${ic('flag', 16)}${flagged ? 'Позначено як помилкове питання' : 'Повідомити про помилку в питанні'}</button>`;
}
function questionBody(q, st) {
  const left = figHTML(q);
  const right = `<h1 class="q-text">${esc(q.t)}</h1><div class="opts" aria-label="Варіанти відповіді">${optsHTML(q, st)}</div>${st.reveal ? explainHTML(q) : ''}`;
  return left
    ? `<div class="q-body two"><div class="left">${left}</div><div class="right">${right}</div></div>`
    : `<div class="q-body"><div class="right col" style="gap:14px">${right}</div></div>`;
}
const secChip = (q) => { const s = DB.secById.get(q.s); return `<span class="chip">${q.s} · ${esc(s.title)}</span>`; };
const saveBtn = (id) => { const on = S.saved.includes(id); return `<button class="icon-btn" data-act="save" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Прибрати зі збережених' : 'Зберегти питання'}" style="color:${on ? 'var(--accent-text)' : 'var(--ink)'}"><svg width="22" height="22" viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="${P.saved}"/></svg></button>`; };

// ---------- навігація по номерах ----------
const ADV_LEARN = 800, ADV_EXAM = 250;   // пауза перед автопереходом, мс
let advT = 0;
function numCells(states, cur, link) {
  return states.map((st, i) => {
    const cls = `qn ${st}${i === cur ? ' cur' : ''}`;
    const lab = `Питання ${i + 1}${st === 'ok' ? ', правильно' : st === 'bad' ? ', помилка' : ''}${i === cur ? ', поточне' : ''}`;
    return link
      ? `<a href="${link}${i}" class="${cls}" aria-label="${lab}"${i === cur ? ' aria-current="true"' : ''}>${i + 1}</a>`
      : `<a href="#" data-act="goto" data-i="${i}" class="${cls}" aria-label="${lab}"${i === cur ? ' aria-current="true"' : ''}>${i + 1}</a>`;
  }).join('');
}
function stripNav(states, cur, link) {
  const n = states.length, grid = n <= 20;
  return `<nav class="numstrip${grid ? ' grid' : ''}"${grid ? ` style="--cols:${Math.min(n, 10)}"` : ''} aria-label="Перехід між питаннями">${numCells(states, cur, link)}</nav>`;
}
function centerStrip() {
  const st = $('.numstrip:not(.grid)'), c = $('.numstrip .cur');
  if (st && c) st.scrollLeft = c.offsetLeft - (st.clientWidth - c.offsetWidth) / 2;
}
function nextTarget(s) {          // найближче питання без відповіді після поточного (по колу)
  const n = s.ids.length;
  for (let k = 1; k <= n; k++) { const j = (s.i + k) % n; if (s.picks[j] == null) return j; }
  return -1;
}
function autoAdvance(delay) {
  clearTimeout(advT);
  advT = setTimeout(() => {
    const s = S.session; if (!s || !location.hash.startsWith('#/session')) return;
    const j = nextTarget(s);
    if (j >= 0) go(j);
    else if (s.mode === 'learn') finishLearn();   // в іспиті лишаємось: з'являється «Завершити іспит»
  }, delay);
}
const learnStates = (s) => s.ids.map((id, i) => (s.picks[i] == null ? '' : s.picks[i] === DB.byId.get(id).a ? 'ok' : 'bad'));

function renderSession() {
  const s = S.session;
  if (!s) return (location.hash = S.last ? '#/done' : '#/');
  const q = DB.byId.get(s.ids[s.i]);
  s.mode === 'exam' ? renderExam(s, q) : renderLearn(s, q);
}

function renderLearn(s, q) {
  const n = s.ids.length, pick = s.picks[s.i], answered = pick != null;
  const st = learnStates(s), okN = st.filter((x) => x === 'ok').length, badN = st.filter((x) => x === 'bad').length;
  const html = `<header class="q-top"><div class="q-top-row"><button class="icon-btn" data-act="closeSession" aria-label="Закрити сесію">${ic('x')}</button>
      <div class="q-count" aria-live="polite">Питання ${s.i + 1} з ${n}<span class="sr">, правильно ${okN}, помилок ${badN}</span></div>${saveBtn(q.id)}</div>
      ${stripNav(st, s.i)}</header>
    <div class="q-body chips" style="padding-bottom:0;flex:0"><div class="row" style="gap:8px;flex-wrap:wrap">${secChip(q)}${s.pre[s.i] === 'mistake' ? '<span class="chip err">Повторення помилки</span>' : ''}</div></div>
    ${questionBody(q, { pick, reveal: answered, lock: answered })}`;
  setView(html, { focus: true });
  centerStrip();
  s.qs = s.qs || Date.now();
}

function examCells(s, cur) {
  return s.ids.map((_, i) => `<a href="#" data-act="goto" data-i="${i}" class="cell ${i === cur ? 'cur' : s.picks[i] != null ? 'done' : ''}" aria-label="Питання ${i + 1}${s.picks[i] != null ? ', є відповідь' : ''}">${i + 1}</a>`).join('');
}
function renderExam(s, q) {
  const n = s.ids.length, left = Math.max(0, s.limit - Math.floor((Date.now() - s.start) / 1000));
  const answered = s.picks.filter((p) => p != null).length, pick = s.picks[s.i], all = answered === n;
  const html = `<div class="ex-bar"><div class="ex-bar-in"><button class="row ex-fin${all ? ' ready' : ''}" data-act="endExam">Завершити</button>
      <div class="timer ${left < 120 ? 'low' : ''}" role="timer" aria-label="Залишилось ${fmtTime(left)}">${ic('exam', 18).replace('currentColor', '#FFC93C')}<span class="num" id="timer" style="font-size:16px">${fmtTime(left)}</span></div>
      <span class="ex-count">${answered} <span style="color:#B7C0D4;font-weight:500">з ${n}</span></span></div></div>
    <div class="ex-cells"><nav class="cells" aria-label="Перехід між питаннями">${examCells(s, s.i)}</nav></div>
    ${questionBody(q, { pick, reveal: false, lock: false })}
    ${all ? `<div class="q-body" style="padding-top:0;flex:0"><button class="btn" data-act="endExam" style="width:100%">Завершити іспит</button></div>` : ''}`;
  setView(html, { focus: true });
  const tick = () => {
    const l = Math.max(0, s.limit - Math.floor((Date.now() - s.start) / 1000));
    const el = $('#timer'); if (el) el.textContent = fmtTime(l);
    if (l <= 0) { clearInterval(timerId); toast('Час вичерпано'); finishExam(true); }
  };
  timerId = setInterval(tick, 500); tick();
}

// ---------- результати ----------
function getRun(key) { return key === 'last' ? S.last : S.exams[Number(key)]; }
function gridHTML(run, key) {
  return `<div class="cells light">${run.ids.map((id, i) => { const p = run.picks[i], ok = p === DB.byId.get(id).a;
    return `<a href="#/review/${key}/${i}" class="cell ${p == null && run.mode === 'learn' ? '' : ok ? 'ok' : 'bad'}" aria-label="Питання ${i + 1}: ${p == null ? 'без відповіді' : ok ? 'правильно' : 'помилка'}">${i + 1}</a>`; }).join('')}</div>`;
}
function resultsHTML(run, key) {
  const exam = run.mode !== 'learn';
  const total = run.ids.length, okN = run.ids.reduce((a, id, i) => a + (run.picks[i] === DB.byId.get(id).a ? 1 : 0), 0);
  const wrong = run.ids.map((id, i) => i).filter((i) => run.picks[i] !== DB.byId.get(run.ids[i]).a);
  const pass = exam && run.pass;
  const top = exam
    ? `<div class="res-top ${pass ? 'pass' : 'fail'}"><div class="big">${ic(pass ? 'check' : 'x', 38)}</div>
        <h1 class="h1" style="color:#fff">${pass ? 'Іспит складено' : 'Іспит не складено'}</h1>
        <p style="max-width:340px;font-size:15px;opacity:.9">${pass ? `Допустимо до ${EXAM.maxErrors} помилок із ${total}.${wrong.length === EXAM.maxErrors ? ' Ви склали впритул — розберіть помилки.' : ''}` : `Було ${wrong.length} ${plural(wrong.length, 'помилка', 'помилки', 'помилок')}, допустимо ${EXAM.maxErrors}. Розберіть помилки й спробуйте ще раз.`}</p>
        <div class="stats"><div><span class="num" style="font-size:22px">${okN}/${total}</span><span class="small">правильно</span></div><div><span class="num" style="font-size:22px">${wrong.length}</span><span class="small">${plural(wrong.length, 'помилка', 'помилки', 'помилок')}</span></div><div><span class="num" style="font-size:22px">${fmtTime(run.secs)}</span><span class="small">з ${fmtTime(EXAM.minutes * 60)}</span></div></div></div>`
    : `<div class="res-top learn" style="background:var(--accent)"><div class="big" style="background:#fff;color:var(--accent)">${ic('check', 38)}</div>
        <h1 class="h1" style="color:#fff">Сесію завершено</h1><p style="font-size:15px;opacity:.9">${esc(run.title || 'Навчання')}</p>
        <div class="stats"><div><span class="num" style="font-size:22px">${okN}/${total}</span><span class="small">правильно</span></div><div><span class="num" style="font-size:22px">${wrong.length}</span><span class="small">${plural(wrong.length, 'помилка', 'помилки', 'помилок')}</span></div><div><span class="num" style="font-size:22px">${fmtTime(run.secs)}</span><span class="small">час</span></div></div></div>`;
  const wrongCards = wrong.map((i) => { const q = DB.byId.get(run.ids[i]), p = run.picks[i];
    return `<a href="#/review/${key}/${i}" class="wrong-card"><span class="small muted" style="font-weight:600">Питання ${i + 1} · Розділ ${q.s}</span><span style="font-size:15px;line-height:21px;font-weight:600">${esc(q.t)}</span>
      ${p != null ? `<span class="l" style="color:var(--err-text)">${ic('x', 16, 'style="margin-top:2px"')}${esc(q.o[p - 1])}</span>` : `<span class="l" style="color:var(--err-text)">Без відповіді</span>`}
      <span class="l" style="color:var(--ok-text);font-weight:600">${ic('check', 16, 'style="margin-top:2px"')}${esc(q.o[q.a - 1])}</span></a>`; }).join('');
  return `<div class="col" style="min-height:100dvh">${top}
    <main class="page" style="flex:1;padding-top:20px"><section class="card" aria-label="Відповіді по питаннях"><h2 class="h2">Усі ${total} питань</h2>${gridHTML(run, key)}
      <p class="small muted">Натисніть на номер, щоб побачити правильну відповідь і пояснення.</p></section>
      <section class="col" style="gap:10px"><h2 class="h2">${wrong.length ? 'Помилки' : 'Без помилок — чудово!'}</h2>${wrongCards}${wrong.length ? '<p class="small muted">Помилкові питання додано до «Роботи над помилками».</p>' : ''}</section>
      <div class="col" style="gap:10px;margin-top:6px">${wrong.length ? `<button class="btn" data-act="reviewWrong" data-key="${key}">Розібрати помилки</button>` : ''}
        <button class="btn sec" data-act="${exam ? 'newExam' : 'again'}">${exam ? 'Новий іспит' : 'Ще одна сесія'}</button><a class="btn sec" href="#/">На головну</a></div></main></div>`;
}

function renderReview(key, i) {
  const run = getRun(key); if (!run) return (location.hash = '#/');
  const n = run.ids.length;
  i = Math.max(0, Math.min(n - 1, Number(i)));
  const q = DB.byId.get(run.ids[i]), pick = run.picks[i];
  const ok = pick === q.a;
  const st = run.ids.map((id, k) => (run.picks[k] == null ? '' : run.picks[k] === DB.byId.get(id).a ? 'ok' : 'bad'));
  const html = `<header class="q-top"><div class="q-top-row"><a class="icon-btn" href="#/${key === 'last' ? 'done' : 'results/' + key}" aria-label="До результатів">${ic('back')}</a>
      <div class="q-count">Питання ${i + 1} з ${n}</div>${saveBtn(q.id)}</div>
      ${stripNav(st, i, `#/review/${key}/`)}</header>
    <div class="q-body chips" style="padding-bottom:0;flex:0"><div class="row" style="gap:8px;flex-wrap:wrap">${secChip(q)}<span class="chip ${pick == null ? '' : ok ? 'ok' : 'err'}">${pick == null ? 'Без відповіді' : ok ? 'Ви відповіли правильно' : 'Ви помилилися'}</span></div></div>
    ${questionBody(q, { pick, reveal: true, lock: true })}`;
  setView(html, { focus: true });
  centerStrip();
}

// ---------- головна ----------
function weekBars() {
  const goal = Math.max(1, S.settings.goal), out = [], names = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  for (let k = 6; k >= 0; k--) {
    const d = addDays(new Date(), -k), n = S.days[dkey(d)]?.n || 0, cur = k === 0;
    const h = Math.max(8, Math.min(70, Math.round((n / goal) * 70)));
    out.push(`<div><i style="height:${h}px;background:${cur ? 'var(--accent)' : n ? 'var(--bar-soft)' : 'var(--track)'}"></i><span style="${cur ? 'font-weight:700;color:var(--ink)' : ''}">${names[d.getDay()]}</span></div>`);
  }
  return out.join('');
}
function weakSections(limit = 3) {
  return DB.sections.map((s) => ({ s, st: secStats(s.id) })).filter((x) => x.st.attempts >= 3 && x.st.acc < 0.85).sort((a, b) => a.st.acc - b.st.acc).slice(0, limit);
}
function renderHome() {
  const r = readiness(), c = counts(), ex = examInfo(), st = streak(), dark = isDark();
  const weekAgo = S.hist[dkey(addDays(new Date(), -7))];
  const delta = weekAgo != null ? r - weekAgo : null;
  const last5 = S.exams.slice(-5), pass5 = last5.filter((e) => e.pass).length;
  const msg = r >= 85 ? 'Ви готові до іспиту' : r >= 65 ? 'Майже готові' : r >= 35 ? 'Непогано, продовжуйте' : c.attempts ? 'Ще багато роботи' : 'Почнімо з першої сесії';
  const left = Math.max(0, 85 - r);
  const tot = c.total;
  const goal = S.settings.goal, today = todayCount();
  const mist = c.mistake;
  const weak = weakSections();
  const html = `<header class="home-head"><h1 class="h1" style="font-size:26px;line-height:32px">Привіт!</h1>
      <div class="row" style="gap:8px;margin-left:auto"><span class="pill warn" aria-label="Серія: ${st} ${plural(st, 'день', 'дні', 'днів')} поспіль">${flame()}${st}</span>
        <button class="icon-btn card" data-act="theme" aria-label="${dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}">${ic(dark ? 'sun' : 'moon', 20)}</button>
        <a class="icon-btn card" href="#/settings" aria-label="Налаштування" style="display:grid;color:var(--ink)">${ic('gear', 20)}</a></div>
      ${ex ? `<span class="row muted home-date"><span style="display:inline-flex;align-items:center;justify-content:center;height:22px;padding:0 8px;border-radius:6px;background:var(--ink);color:var(--bg);font-weight:700;font-size:13px">B</span>Іспит ${ex.label} · ${ex.days > 0 ? `через ${ex.days} ${plural(ex.days, 'день', 'дні', 'днів')}` : ex.days === 0 ? 'сьогодні' : 'дата минула'}</span>`
        : `<a class="row muted home-date" href="#/settings"><span style="display:inline-flex;align-items:center;justify-content:center;height:22px;padding:0 8px;border-radius:6px;background:var(--ink);color:var(--bg);font-weight:700;font-size:13px">B</span>Додати дату іспиту</a>`}</header>
    <section class="hero" aria-label="Готовність до іспиту"><div class="row" style="gap:18px"><div class="ring"><svg viewBox="0 0 120 120" role="img" aria-label="Готовність ${r} відсотків"><circle cx="60" cy="60" r="52" fill="none" stroke="#2E3546" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="#FFC93C" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(r / 100) * 326.7} 327" transform="rotate(-90 60 60)"/></svg>
        <div><span class="num" style="font-size:28px;line-height:32px">${r}%</span><span style="font-size:12px;color:#B7C0D4">готовність</span></div></div>
      <div class="col hero-text" style="gap:8px;min-width:0">${delta != null && delta !== 0 ? `<span class="pill-delta" style="display:inline-flex;align-self:flex-start;align-items:center;gap:6px;border-radius:13px;background:${delta > 0 ? '#1F3B2E' : '#3A1F10'};color:${delta > 0 ? '#7EE2B0' : '#FFB487'};font-size:13px;font-weight:600">${delta > 0 ? ic('up', 12) : ''}${delta > 0 ? '+' : ''}${delta}% за тиждень</span>` : ''}
        <p style="font-size:18px;line-height:24px;font-weight:700">${msg}</p>
        <p style="font-size:14px;line-height:20px;color:#B7C0D4">${last5.length ? `Останні ${last5.length} ${plural(last5.length, 'пробний іспит', 'пробні іспити', 'пробних іспитів')}: склали ${pass5} з ${last5.length}` : r >= 85 ? 'Спробуйте пробний іспит' : `До цілі 85% залишилось ${left}%`}</p></div></div>
      <div class="col" style="gap:8px"><div class="seg" role="img" aria-label="Засвоєно ${c.mastered}, помилки ${c.mistake}, вчу ${c.learning}, нових ${c.new}"><div style="width:${(c.mastered / tot) * 100}%;background:#3DD68C"></div><div style="width:${(c.mistake / tot) * 100}%;background:#FF8A4C"></div><div style="width:${(c.learning / tot) * 100}%;background:#FFC93C"></div></div>
        <div class="legend"><span><b style="background:#3DD68C"></b>Засвоєно ${c.mastered}</span><span><b style="background:#FF8A4C"></b>Помилки ${c.mistake}</span><span><b style="background:#FFC93C"></b>Вчу ${c.learning}</span><span>з ${tot.toLocaleString('uk')}</span></div></div></section>
    <section class="col" style="gap:10px" aria-label="Почати"><button class="cta" data-act="smart" style="text-align:left"><span class="col" style="gap:2px;flex:1;min-width:0"><span style="font-size:18px;line-height:24px;font-weight:700">${c.attempts ? 'Продовжити навчання' : 'Почати навчання'}</span><span style="font-size:14px;line-height:20px;opacity:.85">Розумна сесія · 10 питань · ~5 хв</span></span><span class="play">${ic('play', 20).replace('fill="none"', 'fill="currentColor"')}</span></button>
      <div class="tiles"><a class="tile" href="#/exam"><span class="ic" style="background:var(--warn-soft);color:var(--warn-text)">${ic('exam')}</span><span style="font-size:16px;font-weight:700">Пробний іспит</span><span class="small muted">20 питань · 20&nbsp;хв<br>до 2 помилок</span></a>
        <a class="tile" href="#/topics"><span class="ic" style="background:var(--accent-soft);color:var(--accent-text)">${ic('list')}</span><span style="font-size:16px;font-weight:700">Теми ПДР</span><span class="small muted">${DB.sections.length} розділів<br>навчання по темах</span></a></div></section>
    <section class="card" aria-label="Робота над помилками"><div class="row"><span style="width:40px;height:40px;border-radius:12px;background:var(--err-soft);color:var(--err);display:grid;place-items:center">${ic('redo')}</span>
      <div class="col" style="flex:1;min-width:0"><h2 class="h2">Робота над помилками</h2><p class="small muted">Питання зникне зі списку після 2 правильних відповідей поспіль</p></div></div>
      <div class="row"><div class="col" style="flex:1;gap:2px"><span class="num" style="font-size:22px;color:var(--err)">${mist}</span><span class="small muted">питань до повторення</span></div>
        <button class="btn dark sm" data-act="mistakes" ${mist ? '' : 'disabled'}>Повторити</button></div></section>
    <section class="card" aria-label="Активність"><div class="row between" style="align-items:baseline"><h2 class="h2">Денна ціль</h2><span class="small muted"><b style="color:var(--ink)">${today}</b> з ${goal} ${plural(goal, 'питання', 'питань', 'питань')}</span></div>
      <div class="bar" style="height:10px"><i style="width:${Math.min(100, (today / goal) * 100)}%"></i></div><div class="week">${weekBars()}</div></section>
    <section class="card" style="padding-bottom:6px" aria-label="Слабкі теми"><div class="row between"><h2 class="h2">Слабкі теми</h2><a href="#/topics" class="small" style="font-weight:600;min-height:44px;display:inline-flex;align-items:center">Усі теми</a></div>
      ${weak.length ? `<div class="list">${weak.map(({ s, st }) => `<a href="#/topic/${s.id}"><span class="badge" style="background:var(--err-soft);color:var(--err-text)">${s.id}</span><span class="col" style="flex:1;min-width:0;gap:6px"><span class="t2">${esc(s.title)}</span><span class="bar" style="height:6px"><i style="width:${st.acc * 100}%;background:var(--err)"></i></span></span><span style="font-size:14px;font-weight:700;color:var(--err);width:44px;text-align:right">${pct(st.acc)}</span></a>`).join('')}</div>`
        : `<p class="muted" style="padding:4px 0 14px">Тут з'являться теми, де ви частіше помиляєтесь. Пройдіть кілька сесій.</p>`}</section>
    ${S.exams.length ? `<section class="col" style="gap:10px" aria-label="Останні пробні іспити"><div class="row between"><h2 class="h2">Останні іспити</h2><a href="#/stats" class="small" style="font-weight:600;min-height:44px;display:inline-flex;align-items:center">Прогрес</a></div>
      <div class="exams5">${S.exams.slice(-5).reverse().map((e) => { const i = S.exams.indexOf(e); return `<a href="#/results/${i}" style="background:${e.pass ? 'var(--ok-soft)' : 'var(--err-soft)'};color:${e.pass ? 'var(--ok-text)' : 'var(--err-text)'}"><b>${e.score}</b><span>${e.pass ? 'склав' : 'не склав'}</span></a>`; }).join('')}</div>
      <p class="small muted">Правильних відповідей із ${EXAM.count}. Для складання потрібно ${EXAM.count - EXAM.maxErrors}+</p></section>` : ''}`;
  setView(html, { nav: 'home' });
}

// ---------- теми ----------
let topicFilter = 'all', topicQuery = '';
function topicRow(s) {
  const st = secStats(s.id), p = Math.round(st.know * 100);
  let t = st.attempts === 0 ? 'mute' : tone(p), meta = st.attempts === 0 ? `${s.n} пит. · не почато` : `${s.n} пит. · ${p}%`;
  const [bg, fg, bar] = toneVars[t];
  return `<a class="topic" href="#/topic/${s.id}"><span class="badge" style="background:${bg};color:${fg}">${s.id}</span><span class="col" style="flex:1;min-width:0;gap:6px"><span class="t">${esc(s.title)}</span>
    <span class="row" style="gap:10px"><span class="bar" style="flex:1;height:6px"><i style="width:${st.attempts ? p : 0}%;background:${bar}"></i></span><span class="small muted" style="white-space:nowrap">${meta}</span></span></span></a>`;
}
function filteredSections() {
  const q = topicQuery.trim().toLowerCase();
  return DB.sections.filter((s) => {
    const st = secStats(s.id);
    if (topicFilter === 'weak' && !(st.attempts > 0 && (st.acc < 0.8 || st.mistake > 0))) return false;
    if (topicFilter === 'new' && st.attempts > 0) return false;
    if (topicFilter === 'done' && st.mastered < st.total) return false;
    if (q) return s.title.toLowerCase().includes(q) || s.id === q;
    return true;
  });
}
function renderTopics() {
  const all = DB.sections.map((s) => ({ s, st: secStats(s.id) }));
  const nW = all.filter(({ st }) => st.attempts > 0 && (st.acc < 0.8 || st.mistake > 0)).length, nN = all.filter(({ st }) => !st.attempts).length, nD = all.filter(({ st }) => st.mastered === st.total).length;
  const F = [['all', 'Усі'], ['weak', `Слабкі · ${nW}`], ['new', `Не почато · ${nN}`], ['done', `Вивчено · ${nD}`]];
  setView(`<header class="row between" style="align-items:baseline"><h1 class="h1">Теми</h1><span class="small muted">${DB.sections.length} розділів · ${DB.list.length.toLocaleString('uk')} питань</span></header>
    <label class="search">${ic('search', 20)}<input type="search" id="tq" placeholder="Пошук теми" aria-label="Пошук теми" value="${esc(topicQuery)}"></label>
    <div class="filters" role="group" aria-label="Фільтр">${F.map(([k, l]) => `<button class="filter" data-act="filter" data-k="${k}" aria-pressed="${topicFilter === k}">${l}</button>`).join('')}</div>
    <div class="grid2" id="tlist"></div>`, { nav: 'topics', wide: true });
  fillTopics();
}
function fillTopics() {
  const list = filteredSections();
  $('#tlist').innerHTML = list.length ? list.map(topicRow).join('') : `<div class="empty" style="grid-column:1/-1">Нічого не знайдено</div>`;
}

function renderTopic(sid) {
  const s = DB.secById.get(sid); if (!s) return (location.hash = '#/topics');
  const st = secStats(sid);
  setView(`<header class="row"><a class="icon-btn card" href="#/topics" aria-label="До тем" style="display:grid;color:var(--ink)">${ic('back', 20)}</a><span class="chip">Розділ ${s.id}</span></header>
    <h1 class="h1">${esc(s.title)}</h1>
    <section class="card"><div class="stat4"><div><span class="num" style="color:var(--ok)">${st.mastered}</span><span class="small muted">засвоєно</span></div><div><span class="num" style="color:var(--err)">${st.mistake}</span><span class="small muted">помилки</span></div><div><span class="num" style="color:var(--warn-text)">${st.learning}</span><span class="small muted">вчу</span></div><div><span class="num">${st.new}</span><span class="small muted">нові</span></div></div>
      <div class="bar" style="height:10px"><i style="width:${(st.mastered / st.total) * 100}%;background:var(--ok)"></i></div></section>
    <div class="col" style="gap:10px"><button class="btn" data-act="secTrain" data-sid="${sid}">Тренувати · 10 питань</button>
      <button class="btn sec" data-act="secAll" data-sid="${sid}">Усі ${s.n} ${plural(s.n, 'питання', 'питання', 'питань')} по порядку</button>
      ${st.mistake ? `<button class="btn sec" data-act="secMist" data-sid="${sid}">Тільки помилки · ${st.mistake}</button>` : ''}</div>`, { nav: 'topics' });
}

// ---------- іспит (вступ) ----------
function renderExamIntro() {
  const act = S.session && S.session.mode === 'exam';
  const last = S.exams.slice(-3).reverse();
  setView(`<h1 class="h1">Пробний іспит</h1>
    <section class="card"><p>Як у сервісному центрі МВС. Результат і правильні відповіді — лише після завершення.</p>
      <div class="stat4" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><span class="num">${EXAM.count}</span><span class="small muted">питань</span></div><div><span class="num">${EXAM.minutes}</span><span class="small muted">хвилин</span></div><div><span class="num">${EXAM.maxErrors}</span><span class="small muted">помилки макс.</span></div></div>
      <p class="small muted">Можна повертатися до будь-якого питання й змінювати відповідь, поки іспит не завершено. Питання без відповіді вважаються помилками.</p></section>
    ${act ? `<a class="btn" href="#/session">Продовжити іспит</a><button class="btn sec" data-act="newExam">Почати новий (поточний буде скасовано)</button>` : `<button class="btn" data-act="newExam">Почати іспит</button>`}
    ${last.length ? `<section class="card"><h2 class="h2">Останні спроби</h2><div class="list">${last.map((e) => { const i = S.exams.indexOf(e); const d = new Date(e.t); return `<a href="#/results/${i}"><span class="badge" style="background:${e.pass ? 'var(--ok-soft)' : 'var(--err-soft)'};color:${e.pass ? 'var(--ok-text)' : 'var(--err-text)'}">${e.score}</span><span class="col" style="flex:1"><b>${e.pass ? 'Склав' : 'Не склав'}</b><span class="small muted">${d.toLocaleDateString('uk')} · ${fmtTime(e.secs)}</span></span>${ic('chev', 18)}</a>`; }).join('')}</div></section>` : ''}`, { nav: 'exam' });
}

// ---------- збережені ----------
function renderSaved() {
  const qs = S.saved.map((id) => DB.byId.get(id)).filter(Boolean);
  setView(`<header class="row between" style="align-items:baseline"><h1 class="h1">Збережені</h1><span class="small muted">${qs.length} ${plural(qs.length, 'питання', 'питання', 'питань')}</span></header>
    ${qs.length ? `<button class="btn" data-act="trainSaved">Тренувати збережені</button>
      <div class="col" style="gap:10px">${qs.map((q) => { const e = explanation(q.id); return `<details class="card" style="gap:10px"><summary style="cursor:pointer;font-weight:600;line-height:21px;list-style:none"><span class="small muted">Розділ ${q.s}</span><span>${esc(q.t)}</span></summary>
        ${q.i.length ? `<figure class="q-fig small" style="margin:0"><img src="img/${q.i[0]}" alt="Ілюстрація" data-act="zoom"></figure>` : ''}
        <p style="color:var(--ok-text);font-weight:600" class="row">${ic('check', 18)}<span>${esc(q.o[q.a - 1])}</span></p>${e ? `<p class="small">${esc(e.e)}</p>` : ''}
        <button class="link-btn" style="align-self:flex-start" data-act="save" data-id="${q.id}" data-rerender="1">Прибрати зі збережених</button></details>`; }).join('')}</div>`
      : `<div class="empty">${ic('saved', 32)}<p>Тут будуть питання, які ви збережете закладкою під час навчання.</p></div>`}`, { nav: 'saved' });
}

// ---------- прогрес ----------
let statsPeriod = 14;
function renderStats() {
  const c = counts(), r = readiness();
  const keys = Object.keys(S.days), n = keys.reduce((a, k) => a + S.days[k].n, 0), cor = keys.reduce((a, k) => a + S.days[k].c, 0), secs = keys.reduce((a, k) => a + (S.days[k].s || 0), 0);
  const from = statsPeriod ? dkey(addDays(new Date(), -statsPeriod)) : '0000';
  const pts = Object.keys(S.hist).filter((k) => k >= from).sort().map((k) => [k, S.hist[k]]);
  let chart = `<p class="muted small" style="padding:18px 0">Графік з'явиться після кількох днів навчання.</p>`;
  if (pts.length >= 2) {
    const pageW = Math.min(innerWidth - (innerWidth >= 900 ? 248 : 0), 1040) - 40, W = Math.max(240, Math.round(pageW - 34)), H = 96, x = (i) => (i / (pts.length - 1)) * W, y = (v) => 12 + (1 - v / 100) * H;
    const line = pts.map(([, v], i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    chart = `<svg viewBox="0 0 ${W} 140" width="100%" role="img" aria-label="Готовність від ${pts[0][1]} до ${pts.at(-1)[1]} відсотків; ціль 85 відсотків" style="overflow:visible;display:block"><line x1="0" y1="${y(85)}" x2="${W}" y2="${y(85)}" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="0" y="${y(85) - 4}" font-size="12" fill="var(--ok-text)" font-weight="600">Ціль 85%</text>
      <polygon points="0,${12 + H} ${line} ${W},${12 + H}" fill="var(--accent-soft)"/><polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(pts.length - 1)}" cy="${y(pts.at(-1)[1])}" r="5" fill="var(--accent)" stroke="var(--card)" stroke-width="2"/>
      <line x1="0" y1="${12 + H}" x2="${W}" y2="${12 + H}" stroke="var(--border)"/><text x="0" y="136" font-size="12" fill="var(--muted)">${pts[0][0].slice(5).split('-').reverse().join('.')}</text><text x="${W}" y="136" font-size="12" fill="var(--muted)" text-anchor="end">Сьогодні</text></svg>`;
  }
  const ex = S.exams.slice(-10), passN = ex.filter((e) => e.pass).length;
  const secs2 = DB.sections.map((s) => ({ s, st: secStats(s.id) })).filter((x) => x.st.attempts > 0).sort((a, b) => a.st.acc - b.st.acc).slice(0, 8);
  setView(`<h1 class="h1">Прогрес</h1>
    <div class="seg-ctl" role="group" aria-label="Період">${[[7, 'Тиждень'], [14, '2 тижні'], [0, 'Весь час']].map(([v, l]) => `<button data-act="period" data-v="${v}" aria-pressed="${statsPeriod === v}">${l}</button>`).join('')}</div>
    <section class="card"><div><h2 class="small muted" style="font-weight:600">Готовність до іспиту</h2><span class="num" style="font-size:28px;line-height:34px">${r}%</span></div>${chart}</section>
    <section class="stat4"><div><span class="small muted">Відповідей</span><span class="num stat-v">${n.toLocaleString('uk')}</span></div><div><span class="small muted">Точність</span><span class="num" style="font-size:22px">${n ? pct(cor / n) : '—'}</span></div>
      <div><span class="small muted">Час навчання</span><span class="num" style="font-size:22px">${secs ? fmtDur(secs) : '—'}</span></div><div><span class="small muted">Найдовша серія</span><span class="num" style="font-size:22px">${bestStreak()}\u00a0${plural(bestStreak(), 'день', 'дні', 'днів')}</span></div></section>
    <section class="card"><div class="row between" style="align-items:baseline"><h2 class="h2">Пробні іспити</h2><span class="small muted">${ex.length ? `склали ${passN} з ${ex.length}` : ''}</span></div>
      ${ex.length ? `<div class="ebars" style="grid-template-columns:repeat(10,minmax(0,1fr))"><div style="position:absolute;left:0;right:0;top:${130 - 100 * 0.9 - 0}px;border-top:1.5px dashed var(--ok);pointer-events:none"></div>${ex.map((e) => `<div><span class="small" style="font-weight:700;color:${e.pass ? 'var(--ok-text)' : 'var(--err-text)'}">${e.score}</span><i style="height:${Math.round((e.score / e.total) * 100)}px;background:${e.pass ? 'var(--ok)' : 'var(--err)'};opacity:${e.pass ? 1 : .6}"></i></div>`).join('')}</div>
        <p class="small muted">Пунктир — прохідний рівень (${EXAM.count - EXAM.maxErrors} з ${EXAM.count})</p>` : `<p class="muted small">Ще немає пробних іспитів.</p>`}</section>
    <section class="card"><h2 class="h2">Найслабші розділи</h2>${secs2.length ? secs2.map(({ s, st }) => { const p = Math.round(st.acc * 100), t = tone(p); return `<a href="#/topic/${s.id}" class="col weak-row" style="gap:6px;color:var(--ink)"><span class="row between small" style="font-size:14px"><span style="font-weight:600">${s.id} · ${esc(s.title)}</span><b style="color:${toneVars[t][1]}">${p}%</b></span><span class="bar"><i style="width:${p}%;background:${toneVars[t][2]}"></i></span></a>`; }).join('') : `<p class="muted small">Дані з'являться після перших відповідей.</p>`}</section>`, { nav: 'stats', wide: true });
}

// ---------- налаштування ----------
function renderSettings() {
  const t = S.settings.theme, nf = Object.keys(S.flags).length;
  setView(`<header class="row"><a class="icon-btn card" href="#/" aria-label="Назад" style="display:grid;color:var(--ink)">${ic('back', 20)}</a><h1 class="h1" style="font-size:24px">Налаштування</h1></header>
    <section class="card" style="gap:0"><div class="set-row"><span>Тема</span><div class="toggle" role="group" aria-label="Тема">${[['auto', 'Авто'], ['light', 'Світла'], ['dark', 'Темна']].map(([k, l]) => `<button data-act="setTheme" data-k="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div></div>
      <div class="set-row"><label for="exd">Дата іспиту</label><input type="date" id="exd" value="${S.settings.examDate}"></div>
      <div class="set-row"><label for="goal">Денна ціль, питань</label><input type="number" id="goal" min="5" max="200" step="5" value="${S.settings.goal}"></div></section>
    <section class="card"><h2 class="h2">Дані</h2><p class="small muted">Прогрес зберігається лише на цьому пристрої. Щоб перенести його на інший, збережіть файл і імпортуйте його там.</p>
      <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn sec sm" data-act="export">Експортувати прогрес</button><button class="btn sec sm" data-act="import">Імпортувати</button><input type="file" id="imp" accept="application/json,.json" class="sr"></div></section>
    <section class="card"><h2 class="h2">Помилки в питаннях</h2><p class="small muted">Позначено питань: ${nf}. Скопіюйте список і надішліть розробнику, щоб виправити пояснення.</p>
      <div><button class="btn sec sm" data-act="copyFlags" ${nf ? '' : 'disabled'}>Скопіювати список</button></div></section>
    <section class="card"><h2 class="h2">Скинути прогрес</h2><p class="small muted">Видаляє всі відповіді, історію іспитів і збережені питання на цьому пристрої.</p>
      <div><button class="btn sm" style="background:var(--err)" data-act="reset">Скинути все</button></div></section>
    <p class="small muted" style="text-align:center">Питання й правильні відповіді: офіційна база ГСЦ МВС (наказ від 04.09.2025; таблиця відповідей від 29.10.2025 № 225), категорія B.</p>`, { nav: 'settings' });
}

// ---------- маршрутизатор ----------
function route() {
  const [, a, b, c] = location.hash.split('/');
  const h = a || '';
  switch (h) {
    case '': return renderHome();
    case 'topics': return renderTopics();
    case 'topic': return renderTopic(decodeURIComponent(b));
    case 'exam': return renderExamIntro();
    case 'saved': return renderSaved();
    case 'stats': return renderStats();
    case 'settings': return renderSettings();
    case 'session': return renderSession();
    case 'results': { const run = getRun(b); if (!run) return (location.hash = '#/'); return setView(resultsHTML(run, b), { focus: true }); }
    case 'done': { if (!S.last) return (location.hash = '#/'); return setView(resultsHTML(S.last, 'last'), { focus: true }); }
    case 'review': return renderReview(b, c);
    default: return renderHome();
  }
}

// ---------- події ----------
function pick(k) {
  const s = S.session; if (!s) return;
  const q = DB.byId.get(s.ids[s.i]);
  if (s.mode === 'learn') {
    if (s.picks[s.i] != null) return;       // відповідь уже дано — лише перегляд
    s.picks[s.i] = k;
    record(q.id, k === q.a, Math.round((Date.now() - s.qs) / 1000));
    const y = scrollY;
    saveNow(); renderSession(); scrollTo(0, y);
    autoAdvance(ADV_LEARN);
  } else {
    s.picks[s.i] = k;                        // в іспиті відповідь можна змінити, повернувшись за номером
    saveNow(); renderSession();
    autoAdvance(ADV_EXAM);
  }
}
function go(i) { const s = S.session; if (!s) return; clearTimeout(advT); s.i = Math.max(0, Math.min(s.ids.length - 1, i)); s.qs = Date.now(); saveNow(); renderSession(); }

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, d = el.dataset;
  if (act === 'goto') e.preventDefault();
  switch (act) {
    case 'pick': return pick(Number(d.k));
    case 'goto': return go(Number(d.i));
    case 'closeSession': {
      const s = S.session; const n = s.picks.filter((p) => p != null).length;
      if (!n) { S.session = null; saveNow(); return (location.hash = '#/'); }
      return finishLearn();
    }
    case 'endExam': {
      const s = S.session, un = s.ids.length - s.picks.filter((p) => p != null).length;
      const ok = await confirmBox('Завершити іспит?', un ? `Без відповіді: ${un}. Вони будуть зараховані як помилки.` : 'Ви відповіли на всі питання.', 'Завершити');
      if (ok) finishExam(); return;
    }
    case 'smart': return startSession('learn', pickSmart(10), 'Розумна сесія');
    case 'mistakes': return startSession('learn', pickMistakes(10), 'Робота над помилками');
    case 'again': return startSession('learn', pickSmart(10), 'Розумна сесія');
    case 'newExam': {
      if (activeSession()?.mode === 'exam' && !(await confirmBox('Почати новий іспит?', 'Поточний незавершений іспит буде скасовано.', 'Почати'))) return;
      return startSession('exam', pickExam(), 'Пробний іспит');
    }
    case 'reviewWrong': {
      const run = getRun(d.key); const ids = run.ids.filter((id, i) => run.picks[i] !== DB.byId.get(id).a);
      return startSession('learn', ids, 'Розбір помилок');
    }
    case 'secTrain': return startSession('learn', pickSection(d.sid, 10), DB.secById.get(d.sid).title);
    case 'secAll': return startSession('learn', DB.bySec.get(d.sid).map((q) => q.id), DB.secById.get(d.sid).title);
    case 'secMist': return startSession('learn', DB.bySec.get(d.sid).filter((q) => status(q.id) === 'mistake').map((q) => q.id), DB.secById.get(d.sid).title + ': помилки');
    case 'trainSaved': return startSession('learn', S.saved.slice(0, 50), 'Збережені питання');
    case 'filter': topicFilter = d.k; return renderTopics();
    case 'period': statsPeriod = Number(d.v); return renderStats();
    case 'save': {
      const i = S.saved.indexOf(d.id); i >= 0 ? S.saved.splice(i, 1) : S.saved.push(d.id); save();
      toast(i >= 0 ? 'Прибрано зі збережених' : 'Збережено');
      if (d.rerender) return renderSaved();
      if (el.classList.contains('icon-btn')) { el.outerHTML = saveBtn(d.id); return; }
      return route();
    }
    case 'zoom': { const dlg = dialog(`<img src="${el.src}" alt="Збільшена ілюстрація">`, { cls: 'zoom' }); dlg.addEventListener('click', () => dlg.close()); return; }
    case 'flag': {
      const dlg = dialog(`<form method="dialog" class="col" style="gap:12px"><h2 class="h2">Помилка в питанні</h2><p class="small muted">Що не так? (необов'язково) Нотатка збережеться на цьому пристрої.</p>
        <textarea id="fn" rows="3" style="font:inherit;padding:10px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--ink)">${esc(S.flags[d.id] || '')}</textarea>
        <div class="row" style="gap:10px"><button class="btn sec" style="flex:1" value="no">Скасувати</button><button class="btn" style="flex:1" value="ok">Позначити</button></div></form>`);
      dlg.addEventListener('close', () => { if (dlg.returnValue === 'ok') { S.flags[d.id] = $('#fn', dlg)?.value || '(без коментаря)'; save(); toast('Позначено'); } });
      return;
    }
    case 'theme': S.settings.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); return route();
    case 'setTheme': S.settings.theme = d.k; save(); applyTheme(); return renderSettings();
    case 'export': {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' })); a.download = `pdr-progress-${dkey()}.json`; a.click(); return;
    }
    case 'import': return $('#imp').click();
    case 'copyFlags': {
      const t = Object.entries(S.flags).map(([id, n]) => { const q = DB.byId.get(id); return `[${id}] ${q?.t.slice(0, 90)} — ${n}`; }).join('\n');
      try { await navigator.clipboard.writeText(t); toast('Скопійовано'); } catch { prompt('Скопіюйте:', t); } return;
    }
    case 'reset': if (await confirmBox('Скинути прогрес?', 'Це неможливо скасувати.', 'Скинути')) { resetState(); toast('Прогрес скинуто'); location.hash = '#/'; route(); } return;
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'tq') { topicQuery = e.target.value; fillTopics(); }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'exd') { S.settings.examDate = e.target.value; save(); }
  if (e.target.id === 'goal') { S.settings.goal = Math.max(5, Math.min(200, Number(e.target.value) || 30)); save(); }
  if (e.target.id === 'imp' && e.target.files[0]) {
    e.target.files[0].text().then((t) => { try { importJSON(t); applyTheme(); toast('Прогрес імпортовано'); location.hash = '#/'; route(); } catch { toast('Не вдалося прочитати файл'); } });
  }
});
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea') || document.querySelector('dialog[open]')) return;
  const h = location.hash;
  if (S.session && h.startsWith('#/session')) {
    if (/^[1-6]$/.test(e.key)) pick(Number(e.key));
    else if (e.key === 'ArrowRight') go(S.session.i + 1);
    else if (e.key === 'ArrowLeft') go(S.session.i - 1);
  } else if (h.startsWith('#/review/') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const [, , , key, i] = h.split('/'); location.hash = `#/review/${key}/${Number(i) + (e.key === 'ArrowRight' ? 1 : -1)}`;
  }
});
addEventListener('hashchange', route);

// ---------- старт ----------
(async function init() {
  load(); applyTheme(); mountShell();
  $('#view').innerHTML = '<div class="page"><p class="muted" role="status">Завантаження питань…</p></div>';
  try { await loadData(); } catch { $('#view').innerHTML = '<div class="page"><p>Не вдалося завантажити базу питань. Перевірте з\'єднання й оновіть сторінку.</p></div>'; return; }
  if (S.session?.done) S.session = null;
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
