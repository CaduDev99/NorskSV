const CACHE_NAME = 'nrsk-sv-plataforma-v1';
const ARQUIVOS_PARA_CACHE = [
    './',
    './index.html',
    './style.css',
    './home.js',
    './manifest.json',
    './assets/logo.png',
    './estoque/index.html',
    './estoque/style.css',
    './estoque/parte1-estoque.js',
    './estoque/parte2-estoque.js',
    './estoque/parte3-estoque.js',
    './mercado/index.html',
    './mercado/style.css',
    './mercado/dados-mercado.js',
    './mercado/tela-mercado.js',
    './mercado/acoes-mercado.js',
    './mercado/modal-mercado.js',
    './contas/index.html',
    './contas/style.css',
    './contas/dados-contas.js',
    './contas/app-contas.js',
    './tarefas/index.html',
    './tarefas/style.css',
    './tarefas/dados-tarefas.js',
    './tarefas/app-tarefas.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ARQUIVOS_PARA_CACHE);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
