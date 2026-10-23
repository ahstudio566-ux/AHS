const CACHE_NAME = 'da-nang-green-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx', // In dev mode, this might be tricky, but for prod build it's usually bundled.
  '/index.css', // Assuming CSS is extracted or served
  // Add other static assets here if known, e.g., icons
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like Google Maps or Gemini API for now to avoid opaque response issues
  if (!event.request.url.startsWith(self.location.origin)) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    console.log('Syncing reports...');
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
    // In a real app, this would read from IndexedDB and POST to the server.
    // Since this is a client-side demo without a backend API for reports,
    // we can't fully implement the server-side sync here.
    // The main thread (App.tsx) will handle the sync when 'online' event fires.
    console.log('Service Worker: Sync event triggered. Main thread will handle data sync.');
    
    // However, to demonstrate the code structure as requested:
    /*
    const db = await openDB('daNangGreenDB', 1);
    const reports = await db.getAll('offline_reports');
    for (const report of reports) {
        try {
            await fetch('/api/reports', {
                method: 'POST',
                body: JSON.stringify(report),
                headers: { 'Content-Type': 'application/json' }
            });
            await db.delete('offline_reports', report.id);
        } catch (err) {
            console.error('Failed to sync report:', report.id, err);
        }
    }
    */
}
