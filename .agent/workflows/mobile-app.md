---
description: "Build and ship a React Native + Expo mobile app with push notifications and App Store submission"
---

# Mobile App Workflow

> End-to-end workflow for building a cross-platform mobile app with React Native, Expo, and EAS.

---

## Phase 1 — INIT & CONFIG

1. **Create Expo project:**
   ```bash
   npx -y create-expo-app@latest apps/<app-slug> --template tabs
   cd apps/<app-slug>
   ```

2. **Install essentials:**
   ```bash
   npx expo install expo-router expo-status-bar expo-constants expo-font
   npx expo install @react-native-async-storage/async-storage
   npx expo install expo-notifications expo-device
   ```

3. **Configure EAS Build:**
   ```bash
   npm install -g eas-cli
   eas build:configure
   ```

4. **Set up `eas.json`** — reference `.agent/capabilities/mobile-apps.md` for the full config with development, preview, and production profiles.

5. **⏸️ STOP — Verify `npx expo start` runs the app in Expo Go.**

---

## Phase 2 — SCREENS & NAVIGATION

1. **Define navigation structure** using expo-router file-based routing:
   ```
   app/
     (tabs)/
       index.tsx       # Home
       explore.tsx     # Explore
       profile.tsx     # Profile
     _layout.tsx       # Root layout
     modal.tsx         # Modal example
   ```

2. **Build screens** — each screen should:
   - Have loading, error, and empty states.
   - Use the glassmorphism design system (see `ui-system.md` workflow).
   - Be responsive (test on iPhone SE, standard, and tablet sizes).

3. **Wire API calls** — connect to tRPC backend (see `api-trpc.md` workflow) or REST endpoints.

---

## Phase 3 — PUSH NOTIFICATIONS

1. **Register for push notifications** — use the pattern from `mobile-apps.md` capability.

2. **Send token to backend** — store in user profile for targeted notifications.

3. **Test notifications:**
   ```bash
   # Use Expo's push notification tool
   npx expo notifications:send --to <push-token> --title "Test" --body "Hello!"
   ```

4. **Handle notification routing** — deep link to relevant screen on tap.

---

## Phase 4 — OFFLINE SYNC

1. **Implement offline queue** — use `AsyncStorage` queue pattern from `mobile-apps.md`.

2. **Network detection** — use `@react-native-community/netinfo` to flush queue on reconnect.

3. **Cache critical data** — store last-known-good data for offline browsing.

---

## Phase 5 — BUILD & TEST

1. **Development build** (physical device testing):
   ```bash
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

2. **Preview build** (internal distribution):
   ```bash
   eas build --platform all --profile preview
   ```

3. **Test on devices:**
   - [ ] iOS — iPhone SE (smallest), iPhone 15 (standard), iPad.
   - [ ] Android — Pixel 7 (standard), Samsung Galaxy S24, tablet.
   - [ ] Offline mode — airplane mode, then reconnect.
   - [ ] Push notifications — receive and route correctly.

4. **⏸️ STOP — Human review before production build.**

---

## Phase 6 — PRODUCTION BUILD & SUBMISSION

1. **Production build:**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

2. **App Store submission:**
   ```bash
   eas submit --platform ios --profile production
   eas submit --platform android --profile production
   ```

3. **Post-submission checklist:**
   - [ ] App Store screenshots uploaded (6.7", 6.5", 12.9" iPad).
   - [ ] Privacy policy URL provided.
   - [ ] App description, keywords, and categories set.
   - [ ] TestFlight/internal testing track configured.

---

## PWA Alternative

If native app is not required, use PWA via Next.js + Workbox:
- Follow the PWA setup in `.agent/capabilities/mobile-apps.md`.
- Add `manifest.json` and service worker.
- Test with Lighthouse PWA audit.
