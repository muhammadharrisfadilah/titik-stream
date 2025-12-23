// ===== SERVICE WORKER - TITIK SPORTS PWA =====

const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `titik-sports-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/match-details.html',
    '/css/style.css',
    '/css/match-details.css',
    '/css/ads-styles.css',
    '/js/index/config/app-config.js',
    '/js/index/utils/helpers.js',
    '/logo.png',
    '/assets/favicon-32x32.png',
    '/assets/apple-touch-icon.png',
    '/manifest.json'
];

// Network-first resources (API calls, dynamic data)
const NETWORK_FIRST_PATTERNS = [
    /\/api\//,
    /fotmob\.com\/api/,
    /supabase\.co/
];

// Cache-first resources (static assets, images)
const CACHE_FIRST_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /\.(?:woff|woff2|ttf|otf|eot)$/,
    /\/css\//,
    /\/js\//,
    /images\.fotmob\.com/
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting()) // Activate immediately
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Determine caching strategy
    if (isNetworkFirst(url)) {
        event.respondWith(networkFirst(request));
    } else if (isCacheFirst(url)) {
        event.respondWith(cacheFirst(request));
    } else {
        // Default: network first with cache fallback
        event.respondWith(networkFirst(request));
    }
});

// Network First Strategy (for API calls)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        // For other requests, return error
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Cache First Strategy (for static assets)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        updateCache(request);
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache and network failed:', request.url);
        
        // Return placeholder for images
        if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
            return caches.match('/assets/placeholder.png');
        }
        
        return new Response('Resource not available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Update cache in background
function updateCache(request) {
    fetch(request)
        .then((response) => {
            if (response.ok) {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response);
                });
            }
        })
        .catch(() => {
            // Silent fail - not critical
        });
}

// Check if URL should use Network First
function isNetworkFirst(url) {
    return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href));
}

// Check if URL should use Cache First
function isCacheFirst(url) {
    return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.href));
}

// Background Sync (for offline actions)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-matches') {
        event.waitUntil(syncMatches());
    }
});

async function syncMatches() {
    try {
        // Fetch latest matches in background
        const response = await fetch('/api/data/matches?date=today');
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/api/data/matches?date=today', response);
            console.log('[SW] Matches synced successfully');
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Push Notifications (for live scores)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'TITIK SPORTS';
    const options = {
        body: data.body || 'New match update available!',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-96x96.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'view', title: 'View Match' },
            { action: 'close', title: 'Close' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        const urlToOpen = event.notification.data.url;
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((windowClients) => {
                    // Check if already open
                    for (let client of windowClients) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Message handler (communicate with app)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[SW] Cache cleared');
            })
        );
    }
});

console.log('[SW] Service Worker loaded successfully');