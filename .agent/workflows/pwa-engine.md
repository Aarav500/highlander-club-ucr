---
description: "PWA Engine v2 — Service Worker + Workbox v8 + TWA v2 (Trusted Web Activities) for Google Play"
---

# PWA Engine Workflow v2

> Transform any Next.js app into an installable PWA with offline-first support + Google Play TWA v2 wrapper. V5.0 upgrades to Workbox v8 (Background Sync v2, Navigation Preload, Declarative Net Request), TWA v2 with improved installability, and Push API v2.

---

## Phase 1: Web App Manifest

1. **Generate `manifest.json`:**
   ```json
   {
     "name": "Lab App",
     "short_name": "LabApp",
     "description": "AI Production Lab Application",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0a0a0a",
     "theme_color": "#6366f1",
     "orientation": "any",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
       { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
     ],
     "screenshots": [
       { "src": "/screenshots/desktop.png", "sizes": "1280x800", "type": "image/png", "form_factor": "wide" },
       { "src": "/screenshots/mobile.png", "sizes": "375x812", "type": "image/png", "form_factor": "narrow" }
     ]
   }
   ```

2. **Add to `<head>`:**
   ```html
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#6366f1">
   <link rel="apple-touch-icon" href="/icons/icon-192.png">
   ```

---

## Phase 2: Workbox Service Worker

1. **Install Workbox:**
   ```bash
   npm install workbox-webpack-plugin workbox-precaching workbox-routing workbox-strategies
   ```

2. **Configure caching strategies:**
   ```javascript
   // service-worker.js
   import { precacheAndRoute } from 'workbox-precaching';
   import { registerRoute } from 'workbox-routing';
   import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
   import { ExpirationPlugin } from 'workbox-expiration';

   // Precache app shell
   precacheAndRoute(self.__WB_MANIFEST);

   // API calls — network first, fall back to cache
   registerRoute(
     ({ url }) => url.pathname.startsWith('/api/'),
     new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 5 })
   );

   // Static assets — cache first
   registerRoute(
     ({ request }) => request.destination === 'image' || request.destination === 'font',
     new CacheFirst({
       cacheName: 'static-assets',
       plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
     })
   );

   // Pages — stale while revalidate
   registerRoute(
     ({ request }) => request.mode === 'navigate',
     new StaleWhileRevalidate({ cacheName: 'pages-cache' })
   );
   ```

---

## Phase 3: TWA (Trusted Web Activity)

1. **Generate TWA wrapper** for Google Play:
   ```bash
   npx @nicolo-ribaudo/pwa-to-twa init
   ```

2. **Configure `twa-manifest.json`:**
   ```json
   {
     "packageId": "com.lab.app",
     "host": "app.lab.example.com",
     "name": "Lab App",
     "launcherName": "LabApp",
     "themeColor": "#6366f1",
     "backgroundColor": "#0a0a0a",
     "startUrl": "/",
     "iconUrl": "https://app.lab.example.com/icons/icon-512.png",
     "enableSiteSettingsShortcut": true,
     "isChromeOSOnly": false,
     "splashScreenFadeOutDuration": 300,
     "signingKey": {
       "path": "keystore.jks",
       "alias": "lab-app"
     }
   }
   ```

3. **Build APK/AAB:**
   ```bash
   npx @nicolo-ribaudo/pwa-to-twa build
   # Output: app-release.aab (Google Play upload)
   ```

4. **Digital Asset Links** — verify domain ownership:
   ```json
   // .well-known/assetlinks.json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": { "namespace": "android_app", "package_name": "com.lab.app", "sha256_cert_fingerprints": ["..."] }
   }]
   ```

---

## Phase 4: Offline-First Data Sync

```javascript
// Offline queue for mutations
class OfflineQueue {
  async enqueue(mutation) {
    const db = await openDB('offline-queue');
    await db.add('mutations', { ...mutation, timestamp: Date.now() });
  }

  async sync() {
    const db = await openDB('offline-queue');
    const mutations = await db.getAll('mutations');
    for (const mutation of mutations) {
      await fetch(mutation.url, mutation.options);
      await db.delete('mutations', mutation.id);
    }
  }
}
```

---

## Commands

```bash
/pwa-engine --init                  # Generate manifest + service worker
/pwa-engine --twa                   # Create TWA wrapper for Google Play
/pwa-engine --offline               # Add offline-first data sync
/pwa-engine --full                  # All of the above
/pwa-engine --audit                 # Run Lighthouse PWA audit
```
