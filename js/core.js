// Ядро: стан (localStorage), база питань, добір питань, статистика.
const KEY = 'pdr.v1';
export const EXAM = { count: 20, minutes: 20, maxErrors: 2 };

const blank = () => ({
  q: {},          // id -> {c, w, k, l, t}  (правильно, помилки, серія правильних, остання, час)
  saved: [],      // збережені питання
  flags: {},      // id -> нотатка про помилку в питанні
  exams: [],      // історія пробних іспитів
  days: {},       // 'YYYY-MM-DD' -> {n, c, s}  (відповідей, правильних, секунд)
  hist: {},       // 'YYYY-MM-DD' -> готовність %
  settings: { theme: 'auto', examDate: '', goal: 30 },
  session: null,  // активна сесія (щоб відновлювати після перезавантаження)
});

export let S = blank();
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(blank(), JSON.parse(raw));
    S.settings = Object.assign(blank().settings, S.settings);
  } catch { S = blank(); }
}
let saveTimer = 0;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* повна пам'ять / приватний режим */ } }, 150);
}
export function saveNow() { clearTimeout(saveTimer); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } }
export function replaceState(obj) { S = Object.assign(blank(), obj); S.settings = Object.assign(blank().settings, S.settings); saveNow(); }
export function resetState() { S = blank(); saveNow(); }
addEventListener('pagehide', saveNow);

// ---------- база ----------
export const DB = { sections: [], list: [], byId: new Map(), expl: {} };
export async function loadData() {
  const r = await fetch('data/questions.json');
  const d = await r.json();
  DB.sections = d.sections;
  DB.list = d.questions;
  DB.byId = new Map(d.questions.map((q) => [q.id, q]));
  DB.secById = new Map(d.sections.map((s) => [s.id, s]));
  DB.bySec = new Map();
  for (const q of d.questions) { if (!DB.bySec.has(q.s)) DB.bySec.set(q.s, []); DB.bySec.get(q.s).push(q); }
  try { const e = await fetch('data/explanations.json'); if (e.ok) DB.expl = await e.json(); } catch { /* пояснень ще немає */ }
}
export function explanation(id) {
  const e = DB.expl[id];
  if (!e) return null;
  return typeof e === 'string' ? { e, r: [] } : e;
}

// ---------- дати ----------
export const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
export function examInfo() {
  const v = S.settings.examDate;
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 864e5);
  return { label: `${d} ${MONTHS[m - 1]}`, days };
}
export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

// ---------- статус питання ----------
export function status(id) {
  const r = S.q[id];
  if (!r) return 'new';
  if (r.k >= 2) return 'mastered';
  if (r.w > 0) return 'mistake';
  return 'learning';
}
const WEIGHT = { new: 0, learning: 0.6, mistake: 0.25, mastered: 1 };

export function counts(list = DB.list) {
  const c = { new: 0, learning: 0, mistake: 0, mastered: 0, total: list.length, attempts: 0, correct: 0 };
  let know = 0;
  for (const q of list) {
    const s = status(q.id); c[s]++; know += WEIGHT[s];
    const r = S.q[q.id]; if (r) { c.attempts += r.c + r.w; c.correct += r.c; }
  }
  c.know = c.total ? know / c.total : 0;
  c.acc = c.attempts ? c.correct / c.attempts : null;
  return c;
}
export function secStats(sid) { return counts(DB.bySec.get(sid) || []); }

export function readiness() {
  const c = counts();
  let v = c.know;
  const last = S.exams.slice(-5);
  if (last.length >= 2) {
    const avg = last.reduce((a, e) => a + e.score / e.total, 0) / last.length;
    v = 0.7 * c.know + 0.3 * avg;
  }
  return Math.round(v * 100);
}

// ---------- запис відповіді ----------
export function record(id, ok, secs = 0) {
  const r = S.q[id] || (S.q[id] = { c: 0, w: 0, k: 0, l: 1, t: 0 });
  if (ok) { r.c++; r.k++; } else { r.w++; r.k = 0; }
  r.l = ok ? 1 : 0; r.t = Date.now();
  const d = S.days[dkey()] || (S.days[dkey()] = { n: 0, c: 0, s: 0 });
  d.n++; if (ok) d.c++; d.s += Math.min(Math.max(secs, 0), 120);
  S.hist[dkey()] = readiness();
  save();
}
export function snapshot() { S.hist[dkey()] = readiness(); save(); }

export function streak() {
  let n = 0, d = new Date();
  if (!(S.days[dkey(d)]?.n > 0)) d = addDays(d, -1);
  while (S.days[dkey(d)]?.n > 0) { n++; d = addDays(d, -1); }
  return n;
}
export function bestStreak() {
  const keys = Object.keys(S.days).filter((k) => S.days[k].n > 0).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    cur = prev !== null && Math.round((t - prev) / 864e5) === 1 ? cur + 1 : 1;
    best = Math.max(best, cur); prev = t;
  }
  return best;
}
export const todayCount = () => S.days[dkey()]?.n || 0;

// ---------- добір питань ----------
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export { shuffle };

export const mistakeList = () => DB.list.filter((q) => status(q.id) === 'mistake');

export function pickSmart(n = 10) {
  const mist = shuffle(mistakeList()).sort((a, b) => (S.q[a.id].t || 0) - (S.q[b.id].t || 0)).slice(0, 4);
  const used = new Set(mist.map((q) => q.id));
  const learn = shuffle(DB.list.filter((q) => status(q.id) === 'learning' && !used.has(q.id))).slice(0, 2);
  learn.forEach((q) => used.add(q.id));
  // нові питання: з найслабших розділів, що ще не завершені
  const secScore = new Map(DB.sections.map((s) => [s.id, secStats(s.id).know]));
  const fresh = shuffle(DB.list.filter((q) => status(q.id) === 'new' && !used.has(q.id)))
    .sort((a, b) => secScore.get(a.s) - secScore.get(b.s) + (Math.random() - 0.5) * 0.3);
  let ids = [...mist, ...learn];
  for (const q of fresh) { if (ids.length >= n) break; ids.push(q); }
  if (ids.length < n) {
    const rest = shuffle(DB.list.filter((q) => !ids.includes(q)));
    for (const q of rest) { if (ids.length >= n) break; ids.push(q); }
  }
  return shuffle(ids).slice(0, n).map((q) => q.id);
}
export function pickSection(sid, n = 10) {
  const all = DB.bySec.get(sid) || [];
  const rank = { mistake: 0, new: 1, learning: 2, mastered: 3 };
  const sorted = shuffle(all).sort((a, b) => rank[status(a.id)] - rank[status(b.id)]);
  return shuffle(sorted.slice(0, n)).map((q) => q.id);
}
export function pickExam() {
  // питання з усіх розділів пропорційно до їх розміру, без повторів
  const pool = shuffle(DB.list);
  return pool.slice(0, EXAM.count).map((q) => q.id);
}
export const pickMistakes = (n = 20) => shuffle(mistakeList()).slice(0, n).map((q) => q.id);

// ---------- експорт / імпорт ----------
export function exportJSON() { return JSON.stringify({ app: 'pdr-trainer', v: 1, at: new Date().toISOString(), data: S }); }
export function importJSON(text) {
  const o = JSON.parse(text);
  if (o.app !== 'pdr-trainer' || !o.data) throw new Error('Невірний файл');
  replaceState(o.data);
}

// ---------- Правила дорожнього руху (дослівний текст) і прив'язка питань ----------
export const RULES = { ready: false, meta: null, sections: [], clauses: new Map(), signs: new Map(), marks: new Map(), signGroups: [], markGroups: [], map: {}, list: null };
export async function loadRules() {
  try {
    const [r, m] = await Promise.all([
      fetch('data/rules.json').then((x) => x.json()),
      fetch('data/rulemap.json').then((x) => (x.ok ? x.json() : {})).catch(() => ({})),
    ]);
    RULES.meta = r.meta; RULES.sections = r.sections; RULES.signGroups = r.sign_groups; RULES.markGroups = r.mark_groups;
    for (const c of r.clauses) RULES.clauses.set(c.id, c);
    for (const e of r.signs) for (const i of e.ids) RULES.signs.set(i, e);
    for (const e of r.marks) for (const i of e.ids) RULES.marks.set(i, e);
    RULES.list = r; RULES.map = m; RULES.ready = true;
  } catch { /* правила необов'язкові: застосунок працює й без них */ }
}
// елементи для плашки під питанням: [{kind:'p'|'s'|'m', id, title, sub, text, quote}]
export function ruleItems(qid) {
  const m = RULES.ready && RULES.map[qid]; if (!m) return [];
  const out = [];
  for (const id of m.r || []) { const c = RULES.clauses.get(id); if (c) { const sec = RULES.sections.find((s) => s.id === c.sec); out.push({ kind: 'p', id, title: `ПДР, п. ${id}`, sub: sec ? `Розділ ${sec.id}. ${cap(sec.title)}` : '', text: c.text, quote: m.q, link: `#/rules/${c.sec}/${id}` }); } }
  for (const id of m.s || []) { const e = RULES.signs.get(id); if (e) { const g = RULES.signGroups.find((x) => x.n === e.grp); out.push({ kind: 's', id, title: `Дорожній знак ${e.label}`, sub: g ? `Додаток 1 · ${g.title}` : 'Додаток 1', text: e.text, quote: m.q, link: `#/rules/signs/${id}` }); } }
  for (const id of m.m || []) { const e = RULES.marks.get(id); if (e) { const g = RULES.markGroups.find((x) => x.n === e.grp); out.push({ kind: 'm', id, title: `Дорожня розмітка ${e.label}`, sub: g ? `Додаток 2 · ${g.title}` : 'Додаток 2', text: e.text, quote: m.q, link: `#/rules/marks/${id}` }); } }
  return out;
}
export const hasRule = (qid) => !!(RULES.ready && RULES.map[qid]);
function cap(s) { s = (s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
export const OFFICIAL_URL = 'https://zakon.rada.gov.ua/laws/show/1306-2001-%D0%BF';
