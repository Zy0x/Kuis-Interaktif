const CACHE_NAME = 'kuis-sd-seru-v2.3.83';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/favicon.svg',
  '/manifest.webmanifest'
];

// Install: Simpan aset shell inti ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Bersihkan cache versi lama secara menyeluruh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Deleting obsolete cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Pesan dari client untuk memicu instant update
self.addEventListener('message', (event) => {
  if (event.data && (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

// Fetch handling:
// 1. Navigasi HTML: Network-First (agar hash Vite selalu terbarukan, fallback ke cache jika offline)
// 2. Static Assets: Stale-While-Revalidate
// 3. API / Supabase: Langsung Network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan sentuh request API Supabase, Google Drive, atau third-party AI
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('pollinations.ai') ||
    url.hostname.includes('groq.com') ||
    url.hostname.includes('deepseek.com') ||
    url.pathname.startsWith('/functions/')
  ) {
    return;
  }

  // A. Permintaan Navigasi Dokumen HTML (Network-First)
  const isNavigation = event.request.mode === 'navigate' || 
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B. Static Assets lokal (Stale-While-Revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});