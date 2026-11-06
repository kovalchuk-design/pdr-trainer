// Service worker: офлайн-режим. Оболонка й дані — кеш + оновлення у фоні; картинки — кеш при першому перегляді.
const V = 'pdr-v6';
const SHELL = ['./', 'index.html', 'styles.css', 'js/app.js', 'js/core.js', 'manifest.webmanifest', 'data/questions.json', 'data/explanations.json', 'icons/icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.includes('/img/')) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => {
    const net = fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
