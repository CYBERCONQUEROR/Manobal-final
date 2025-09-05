const CACHE_NAME = 'mental-health-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  // Add other critical assets to cache
  '/src/pages/HomePage.tsx',
  '/src/pages/BookingPage.tsx',
  '/src/pages/CommunityPage.tsx',
  '/src/pages/ResourcesPage.tsx',
  '/src/pages/LoginPage.tsx',
  '/src/pages/AdminPage.tsx',
  '/src/pages/ProfilePage.tsx',
  '/src/components/Navigation.tsx',
  '/src/contexts/AuthContext.tsx',
  '/src/contexts/ThemeContext.tsx',
  '/src/firebase.ts',
  '/src/services/resourceService.ts',
  '/src/services/bookingService.ts',
  // Consider caching fonts, images, and other static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
