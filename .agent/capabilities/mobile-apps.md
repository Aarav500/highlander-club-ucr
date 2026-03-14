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

---

## Expo SDK 53 + React Native 0.76 (2026)

### New Architecture (Default in RN 0.76)

```bash
# Init with latest Expo SDK 53
npx -y create-expo-app@latest my-app --template tabs

# RN 0.76 enables New Architecture by default:
# ✅ Fabric renderer (concurrent features)
# ✅ TurboModules (lazy native module loading)
# ✅ Codegen (type-safe native bridge)
```

### Key SDK 53 Changes

| Feature | Old | New (SDK 53) |
|---------|-----|-------------|
| Architecture | Bridge (async JSON) | Fabric + TurboModules (sync JSI) |
| Rendering | Paper | Fabric (concurrent) |
| Native modules | Bridge modules | TurboModules (lazy + sync) |
| Dev tools | Flipper | React DevTools + built-in |
| Config | `app.json` | `app.config.ts` (typed) |

### Typed App Config

```typescript
// app.config.ts — fully typed with autocompletion
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "My App",
  slug: "my-app",
  version: "1.0.0",
  scheme: "myapp",
  orientation: "portrait",
  newArchEnabled: true,  // Default true in SDK 53
  experiments: {
    reactCompiler: true,  // Enable React Compiler
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.example.myapp",
  },
  android: {
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png" },
    package: "com.example.myapp",
  },
  plugins: [
    "expo-router",
    ["expo-splash-screen", { image: "./assets/splash.png" }],
  ],
});
```

---

## React Compiler for React Native

### What It Does

The React Compiler automatically memoizes components and hooks — **no more manual `useCallback`, `useMemo`, or `React.memo`**.

```tsx
// ❌ Before (React Native 0.75 and earlier)
const MemoizedComponent = React.memo(({ data }: Props) => {
  const processedData = useMemo(() => expensiveTransform(data), [data]);
  const handlePress = useCallback(() => onSelect(data.id), [data.id]);
  return <Pressable onPress={handlePress}><Text>{processedData}</Text></Pressable>;
});

// ✅ After (React Compiler — SDK 53 / RN 0.76)
function Component({ data }: Props) {
  const processedData = expensiveTransform(data);
  const handlePress = () => onSelect(data.id);
  return <Pressable onPress={handlePress}><Text>{processedData}</Text></Pressable>;
}
// Compiler auto-memoizes — same performance, cleaner code
```

### Enable in Expo

```json
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["babel-plugin-react-compiler", { target: "19" }],
    ],
  };
};
```

---

## Expo Router v4 — File-Based Routing

### Directory Structure

```
app/
├── _layout.tsx          # Root layout (navigation container)
├── index.tsx            # Home screen (/)
├── (tabs)/              # Tab group
│   ├── _layout.tsx      # Tab navigator config
│   ├── index.tsx        # First tab
│   ├── explore.tsx      # /explore
│   └── profile.tsx      # /profile
├── (auth)/              # Auth group (no tabs)
│   ├── _layout.tsx      # Stack navigator
│   ├── login.tsx        # /login
│   └── register.tsx     # /register
├── [id].tsx             # Dynamic route /123
├── settings/
│   ├── _layout.tsx      # Nested stack
│   ├── index.tsx        # /settings
│   └── [section].tsx    # /settings/privacy
└── +not-found.tsx       # 404 screen
```

### Typed Routes

```tsx
// app/_layout.tsx — Root layout with typed navigation
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

// Navigate with full type safety
import { router } from "expo-router";

router.push("/explore");           // Static route
router.push({ pathname: "/[id]", params: { id: "123" } });  // Dynamic
router.replace("/(auth)/login");   // Replace in stack
router.back();                     // Go back
```

### API Routes (Expo Router v4)

```typescript
// app/api/data+api.ts — serverless function
export async function GET(request: Request) {
  const data = await fetchFromDB();
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await saveTooDB(body);
  return Response.json(result, { status: 201 });
}
```

---

## Reanimated v4 — Native Thread Animations

### Setup

```bash
npx expo install react-native-reanimated@^4
```

### Shared Value Animations

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

function AnimatedCard() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
    opacity: withTiming(opacity.value, { duration: 200 }),
  }));

  return (
    <Animated.View
      style={[styles.card, animatedStyle]}
      onTouchStart={() => { scale.value = 0.95; opacity.value = 0.8; }}
      onTouchEnd={() => { scale.value = 1; opacity.value = 1; }}
    />
  );
}
```

### Shared Element Transitions

```tsx
import Animated, { SharedTransition, withSpring } from "react-native-reanimated";

const transition = SharedTransition.custom((values) => {
  "worklet";
  return {
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});

// List screen
<Animated.Image
  sharedTransitionTag={`image-${item.id}`}
  sharedTransitionStyle={transition}
  source={{ uri: item.thumbnail }}
/>

// Detail screen — same tag = auto shared element transition
<Animated.Image
  sharedTransitionTag={`image-${item.id}`}
  sharedTransitionStyle={transition}
  source={{ uri: item.fullImage }}
/>
```

### Layout Animations

```tsx
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

function AnimatedList({ items }: { items: Item[] }) {
  return (
    <Animated.FlatList
      data={items}
      itemLayoutAnimation={LinearTransition.springify()}
      renderItem={({ item, index }) => (
        <Animated.View
          entering={FadeInDown.delay(index * 80).springify()}
          exiting={FadeOutUp.duration(200)}
          layout={LinearTransition.springify()}
        >
          <Text>{item.title}</Text>
        )}
    />
  );
}
```

---

## Flutter 4.0 + Dart 4 (V3.0)

### Setup

```bash
# Install Flutter 4.0
flutter channel stable
flutter upgrade

# Create new project (iOS + Android + Web + Desktop)
flutter create --platforms=ios,android,web,macos,windows,linux my_app
cd my_app
```

### Key Flutter 4.0 Features

| Feature | Description |
|---------|-------------|
| **Dart 4** | Macros, pattern matching, sealed classes |
| **Impeller** | Metal/Vulkan renderer (no Skia), 120fps |
| **Native assets** | Link C/Rust libs directly via `native_assets` |
| **DevTools v2** | AI-powered performance profiling |
| **Hot reload** | < 100ms stateful hot reload |

### Widget Architecture (Clean Architecture)

```dart
// lib/features/portfolio/presentation/portfolio_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PortfolioPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final portfolio = ref.watch(portfolioProvider);

    return Scaffold(
      body: portfolio.when(
        data: (data) => GlassCard(
          child: Column(
            children: [
              Text('\$${data.totalValue.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.headlineLarge),
              PerformanceChart(data: data.history),
              HoldingsList(holdings: data.holdings),
            ],
          ),
        ),
        loading: () => const ShimmerLoader(),
        error: (err, _) => ErrorCard(message: err.toString()),
      ),
    );
  }
}
```

### Glassmorphism in Flutter

```dart
// lib/widgets/glass_card.dart
class GlassCard extends StatelessWidget {
  final Widget child;
  const GlassCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            boxShadow: [BoxShadow(
              color: Colors.black.withOpacity(0.37),
              blurRadius: 32, offset: const Offset(0, 8),
            )],
          ),
          padding: const EdgeInsets.all(24),
          child: child,
        ),
      ),
    );
  }
}
```

---

## Tauri v2 — Native Desktop (V3.0)

### Setup

```bash
# Create Tauri v2 app with Next.js frontend
npm create tauri-app@latest my-desktop-app -- --template next
cd my-desktop-app
```

### Key Tauri v2 Features

| Feature | Tauri v2 | Electron | Winner |
|---------|---------|----------|--------|
| Binary size | ~3 MB | ~150 MB | Tauri (50x smaller) |
| Memory usage | ~30 MB | ~300 MB | Tauri (10x less) |
| Backend | Rust | Node.js | Tauri (performance) |
| Frontend | Any web framework | Any web framework | Tie |
| Mobile | iOS + Android | No | Tauri |
| Auto-update | Built-in | electron-updater | Tie |

### Rust Backend Commands

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[tauri::command]
async fn fetch_portfolio(app: tauri::AppHandle) -> Result<Portfolio, String> {
    let client = reqwest::Client::new();
    let resp = client.get("https://api.example.com/portfolio")
        .send().await.map_err(|e| e.to_string())?;
    let portfolio: Portfolio = resp.json().await.map_err(|e| e.to_string())?;
    Ok(portfolio)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_portfolio])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```

### Frontend Integration

```typescript
// src/app/page.tsx
import { invoke } from "@tauri-apps/api/core";

async function loadPortfolio() {
  const portfolio = await invoke<Portfolio>("fetch_portfolio");
  return portfolio;
}
```

---

## Capacitor — Hybrid PWAs (V3.0)

### Setup

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "My App" com.example.myapp
npx cap add ios
npx cap add android

# Sync web build to native projects
npm run build
npx cap sync
```

### Native API Access

```typescript
import { Camera, CameraResultType } from "@capacitor/camera";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";

// Take photo
const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri,
});

// Haptic feedback
await Haptics.impact({ style: ImpactStyle.Medium });

// Local notification
await LocalNotifications.schedule({
  notifications: [{
    title: "Portfolio Alert",
    body: "AAPL is up 5% today",
    id: 1,
    schedule: { at: new Date(Date.now() + 5000) },
  }],
});
```

### Cross-Platform Strategy

| Platform | Technology | Best For |
|----------|-----------|----------|
| **Web** | Next.js + PWA | SEO, quick access |
| **iOS/Android** | Expo (React Native) | Native mobile apps |
| **iOS/Android/Desktop** | Flutter | Single codebase everywhere |
| **Desktop** | Tauri v2 | High-performance desktop |
| **Hybrid** | Capacitor | PWA → native wrapper |

