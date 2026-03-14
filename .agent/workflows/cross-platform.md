---
description: "Cross-platform v3 — Flutter 4.3 + Tauri 2.1 + React Native 0.79 + shared API + unified theming"
---

# Cross-Platform Workflow (V8.0)

> Flutter 4.3 (Impeller v3, WASM), Tauri 2.1 (deep links, auto-update v2), React Native 0.79 (static Hermes, Expo 53). Unified theming, cross-platform CI/CD matrix, platform-specific feature flags.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| Flutter | 4.2 | **4.3** (Impeller v3, web WASM, macOS native) |
| Tauri | 2.0 | **2.1** (deep links, auto-update v2, tray icon) |
| React Native | 0.78 (Fabric/Turbo) | **0.79** (static Hermes, Expo 53, Expo Modules) |
| API Client | Shared Dart/TS | + **gRPC-web** + **tRPC** shared types |
| Theming | Per-platform | **Unified theming** system (design tokens) |
| CI/CD | Manual per-platform | **Cross-platform CI/CD matrix** |
| Feature Flags | None | **Platform-specific feature flags** |

---

## Architecture

```
                    ┌─────────────────┐
                    │  tRPC / gRPC    │
                    │  Backend API    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │  Flutter 4.3 │ │ Next.js  │ │  Tauri 2.1   │
      │  iOS/Android │ │ Web App  │ │  Desktop     │
      │  + Web WASM  │ │ + RN 0.79│ │  Win/Mac/Lin │
      └──────────────┘ └──────────┘ └──────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Unified Theme  │
                    │  Design Tokens  │
                    └─────────────────┘
```

---

## Phase 1: Flutter 4.3 (V8.0)

```bash
flutter create --org com.<org> --platforms ios,android,web,macos apps/mobile
cd apps/mobile

# V8.0 dependencies
flutter pub add dio freezed_annotation riverpod go_router
flutter pub add dev:freezed build_runner json_serializable

# Enable Impeller v3 + WASM web
flutter config --enable-impeller
flutter config --enable-web-wasm
```

```
apps/mobile/
  lib/
    core/            ← Theme, routing, DI (unified design tokens)
    features/        ← Feature-based modules
    shared/          ← Shared widgets, utils
    api/             ← Generated API client (tRPC / gRPC)
    platform/        ← Platform-specific feature flags
  test/
  integration_test/
```

---

## Phase 2: Tauri 2.1 Desktop (V8.0)

```json
{
  "build": {
    "devUrl": "http://localhost:3000",
    "frontendDist": "../web/out"
  },
  "app": {
    "title": "Lab App",
    "windows": [{ "width": 1280, "height": 800, "resizable": true }],
    "deepLinks": ["labapp://"],
    "trayIcon": { "iconPath": "icons/tray.png", "tooltip": "Lab App" }
  },
  "plugins": {
    "updater": { "endpoints": ["https://releases.example.com/{{target}}/{{current_version}}"] },
    "deep-link": { "mobile": false, "desktop": true }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "deb", "appimage", "nsis"]
  }
}
```

---

## Phase 3: React Native 0.79 + Expo 53 (V8.0)

```bash
npx create-expo-app@latest apps/rn-app --template expo-template-blank-typescript
cd apps/rn-app

# V8.0: Expo 53 + static Hermes
npx expo install expo-router expo-modules-core
```

```json
{
  "expo": {
    "jsEngine": "hermes",
    "experiments": { "staticHermes": true },
    "newArchEnabled": true,
    "plugins": ["expo-router"]
  }
}
```

---

## Phase 4: Unified Theming (V8.0 NEW)

```json
{
  "tokens": {
    "colors": {
      "primary": { "50": "#eff6ff", "500": "#3b82f6", "900": "#1e3a5f" },
      "surface": { "light": "#ffffff", "dark": "#0f172a" }
    },
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "typography": {
      "heading": { "fontFamily": "Inter", "fontWeight": 700 },
      "body": { "fontFamily": "Inter", "fontWeight": 400 }
    },
    "radii": { "sm": 4, "md": 8, "lg": 16 }
  }
}
```

---

## Phase 5: Build & Release (V8.0)

| Platform | Build Command | Output |
|----------|--------------|--------|
| iOS | `flutter build ipa` | `.ipa` for TestFlight |
| Android | `flutter build appbundle` | `.aab` for Play Store |
| Web (Flutter WASM) | `flutter build web --wasm` | WASM bundle |
| Web (Next.js) | `npm run build` | Vercel / Docker |
| macOS | `npx tauri build` + `flutter build macos` | `.dmg` |
| Windows | `npx tauri build` | `.msi` / `.nsis` |
| Linux | `npx tauri build` | `.deb` / `.AppImage` |
| Expo iOS | `eas build --platform ios` | TestFlight |
| Expo Android | `eas build --platform android` | Play Store |

---

## Commands

```bash
# Scaffold all platforms (V8.0)
/cross-platform --init --name my-app --flutter43 --tauri21 --rn79

# Build for specific platform
/cross-platform --build --platform ios
/cross-platform --build --platform web-wasm  # V8.0: WASM build

# Build all platforms
/cross-platform --build --all

# Generate API client
/cross-platform --gen-client --schema api-schema.json --grpc --trpc

# Sync design tokens (V8.0)
/cross-platform --sync-theme --tokens design-tokens.json

# Cross-platform CI/CD matrix (V8.0)
/cross-platform --ci --matrix ios,android,web,macos,windows,linux
```
