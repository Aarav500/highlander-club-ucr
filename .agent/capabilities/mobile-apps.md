# Mobile Apps

> Reference for building cross-platform mobile apps with React Native + Expo, push notifications, offline sync, and PWA fallback.

---

## React Native + Expo

### Project Init

```bash
npx -y create-expo-app@latest my-app --template tabs
cd my-app
npx expo install expo-router expo-status-bar expo-constants
```

### EAS Build (Cloud Builds)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS and Android
eas build --platform ios --profile production
eas build --platform android --profile production
```

### eas.json Configuration

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com", "ascAppId": "1234567890" },
      "android": { "serviceAccountKeyPath": "./google-services.json" }
    }
  }
}
```

### App Store Automation

```bash
# Submit to App Store and Play Store
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Push Notifications

### Expo Notifications

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Send token to your backend for storage
  await fetch("/api/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return token;
}
```

### Server-Side Push

```typescript
import { Expo } from "expo-server-sdk";

const expo = new Expo();

async function sendPush(tokens: string[], title: string, body: string) {
  const messages = tokens
    .filter(Expo.isExpoPushToken)
    .map((to) => ({ to, title, body, sound: "default" as const }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
```

---

## Offline Sync

### AsyncStorage + Sync Queue

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

class OfflineSyncQueue {
  private queue: PendingAction[] = [];

  async enqueue(action: PendingAction) {
    this.queue.push(action);
    await AsyncStorage.setItem("sync_queue", JSON.stringify(this.queue));
  }

  async flush() {
    const stored = await AsyncStorage.getItem("sync_queue");
    if (!stored) return;
    const queue: PendingAction[] = JSON.parse(stored);
    for (const action of queue) {
      try {
        await fetch(action.url, { method: action.method, body: action.body });
        queue.shift();
      } catch {
        break; // Stop on first failure, retry later
      }
    }
    await AsyncStorage.setItem("sync_queue", JSON.stringify(queue));
  }
}
```

### Network Detection

```typescript
import NetInfo from "@react-native-community/netinfo";

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    syncQueue.flush();
  }
});
```

---

## PWA: Next.js + Workbox

### Setup

```bash
npm install next-pwa workbox-webpack-plugin
```

### next.config.js

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
      },
    },
  ],
});

module.exports = withPWA({ /* Next.js config */ });
```

### manifest.json

```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#8b5cf6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Offline Fallback

Workbox automatically caches pages and API responses. For full offline support:
- Cache critical pages on install (app shell).
- Use `NetworkFirst` for API calls (serve stale if offline).
- Use `CacheFirst` for static assets (images, fonts).
