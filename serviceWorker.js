const CACHE_NAME = 'jak';
const ASSETS = [
    'index.html',
    'flickr.html',
    'script.html',
    'stylesheet.css',
    'app.js',
    './icons/search-64.png',
    './icons/loader.gif'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(fetchResponse => {
                if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic' || event.request.method !== 'GET') {
                    return fetchResponse;
                }
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return fetchResponse;
            });
        }).catch(() => {
            if (event.request.destination === 'image') {
                return caches.match('./icons/fallback-image.png');
            }
        })
    );
});
