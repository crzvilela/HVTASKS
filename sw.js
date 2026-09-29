// HVTASK — service worker
// Cuida só do "app shell" (o próprio HTML) pra permitir abrir offline depois da primeira visita.
// Os dados do usuário (tarefas, conclusões, lembretes) NÃO passam por aqui — ficam no localStorage,
// que já é local ao aparelho por conta própria.

const CACHE_NAME = 'hvtask-shell-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais nova quando há internet),
// cai pro cache quando offline. Guarda em cache toda resposta boa que passar por aqui
// (isso inclui a fonte do Google Fonts, então depois da primeira visita ela também funciona offline).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});
