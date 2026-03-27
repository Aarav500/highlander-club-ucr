# Implementation Plan: Highlander Events

> Spec: `specs/highlander-events-spec.md`
> Phase: PLAN → awaiting approval → IMPLEMENT

---

## Phase 1: Foundation (Backend + Auth + DB)

### Task 1.1 — Expo Project Scaffold
- `npx create-expo-app apps/mobile --template tabs`
- Configure Expo Router file-based routing
- Install deps: `react-native-maps`, `expo-notifications`, `expo-device`, `expo-linking`
- UCR brand theme: Blue #2D6CC0, Gold #F1AB00, dark mode default
- Typography: Inter from Google Fonts

### Task 1.2 — Database Schema
- Create `apps/api-node/src/db/schema.sql` with 9 tables (users, login_codes, clubs, club_members, events, rsvps, follows, friendships, event_photos)
- Event `status` column (draft/published/cancelled), `max_attendees`, `views` counter
- `@ucr.edu` CHECK constraint on users.email
- Indexes: events(start_time), events(category), events(club_id), events(status), rsvps(event_id), follows(user_id)
- Run migrations against Railway PostgreSQL
- Seed: 3 sample clubs, 10 sample events

### Task 1.3 — Express API Scaffold
- Initialize `apps/api-node/` with Express + pg driver
- Middleware: CORS, JSON parsing, error handler (`{ error, details? }` format)
- Connect to Railway PostgreSQL via `DATABASE_URL`
- S3 upload middleware (multer + @aws-sdk/client-s3)

### Task 1.4 — Auth System
- `POST /api/auth/login` — validate @ucr.edu, generate 6-digit code, store in login_codes with 10-min expiry, send via email (or log in dev)
- `POST /api/auth/verify` — verify code, create/find user, return JWT
- JWT middleware: verify token, attach user to request
- Club admin middleware: check `club_members.role = 'admin'` for officer-only routes
- Throttle login endpoint (rate limit per email)

### Task 1.5 — Core API Routes
- Events: CRUD with status (draft/published/cancelled), only published in public queries
- Events: `/happening-now` (start_time <= now <= end_time)
- Events: detail view increments `views` counter
- RSVP: toggle, enforce `max_attendees` if set
- `/events/:id/friends` — friends who RSVP'd
- Clubs: CRUD, follow toggle, follower count
- Users: profile, personalized feed (followed clubs first → then popular)
- `/users/me/friends-activity` — events friends RSVP'd to with counts
- Search: events + clubs by keyword
- Notifications: register push token

**⏸️ REVIEW GATE — Backend complete, request review.**

---

## Phase 2: Core Mobile Features

### Task 2.1 — Vertical Event Feed
- Full-screen `FlatList` with `pagingEnabled`, `snapToAlignment="start"`, `decelerationRate="fast"`, `snapToInterval={screenHeight}`
- `EventCard`: blurred image background, title, club logo, countdown, RSVP button, friend count
- Pull-to-refresh, infinite scroll pagination
- "Happening Now" horizontal banner at top (calls `/api/events/happening-now`)

### Task 2.2 — RSVP System
- Animated RSVP button (heart pop animation)
- Attendee count + "Almost Full!" badge when near `max_attendees`
- Attendee list modal

### Task 2.3 — Club Follow + Personalized Feed
- Follow/unfollow button on club profiles
- Feed algorithm: followed clubs first → then by recency + RSVP count
- Followed clubs list in profile tab

### Task 2.4 — Filters + Categories + Search
- Horizontal scrollable category pills (Academic, Social, Sports, Career, Cultural, Greek Life)
- Date picker filter
- Search screen: debounced text input → events + clubs results

### Task 2.5 — Friend Activity
- Add friend by @ucr.edu email
- "X friends are going" badge on event cards (calls `/events/:id/friends`)
- Friends tab in profile

**⏸️ REVIEW GATE — Core mobile complete, request review.**

---

## Phase 3: Enhanced Features

### Task 3.1 — Push Notifications
- `expo-notifications` + `expo-device`: request permission on first login
- `Notifications.getExpoPushTokenAsync()` → POST to `/api/notifications/register`
- Notification listeners: tapping opens `event/[id]` via Expo Router
- Backend triggers: event reminder (1h before), new event from followed club

### Task 3.2 — Calendar View
- Monthly calendar with colored dots for events
- Tap day → event list for that day
- Tab bar toggle: Feed ↔ Calendar

### Task 3.3 — Campus Map
- `react-native-maps` centered on UCR (33.9737, -117.3281)
- Colored pins per category
- Bottom sheet event detail on pin tap

### Task 3.4 — Countdown Timer + Happening Now
- Client-side hook: ticks once per minute, formats "Starts in 2h 30m"
- "Happening Now" banner: top N live events horizontally scrollable
- Auto-update when events start/end

### Task 3.5 — Deep Link Sharing
- Expo Router Linking config: `highlanderevents://event/:id`
- Share sheet integration (iOS/Android native share)
- Universal links fallback for web

### Task 3.6 — Event Detail Screen
- Cover image hero
- Full description, location, time
- "X friends are going" section
- Attendee list
- Share button with deep link

**⏸️ REVIEW GATE — Enhanced features complete, request review.**

---

## Phase 4: V1.1 Features (Post-Launch Fast Follow)

### Task 4.1 — Club Dashboard
- Officer-only screen
- Stats: total views (from events.views), RSVP counts (from rsvps), follower count (from follows)
- Per-event metrics
- Simple bar charts

### Task 4.2 — Photo Gallery
- Post-event photo uploads to S3
- Gallery carousel on event detail
- Club admin moderation (approve/reject)

### Task 4.3 — Weekly Digest
- Scheduled push: "This week at UCR"
- Top 5 events by RSVP count

**⏸️ FINAL REVIEW GATE — Full review + verify before ship.**

---

## Verification

### Backend Tests (Jest + Supertest)
```bash
cd apps/api-node && npm test
```
- Auth: login → code → verify → JWT → protected route
- Auth: reject non-@ucr.edu emails
- Events: CRUD + status filtering (only published visible)
- Events: happening-now query returns correct time window
- RSVP: toggle + max_attendees enforcement
- Follow: toggle + feed personalization
- Friends: activity endpoint returns correct counts
- Search: keyword matching

### Mobile Build
```bash
cd apps/mobile && npx expo export --platform android
cd apps/mobile && npx expo export --platform ios
```

### Manual Testing (Expo Go on physical device)
1. Sign in with @ucr.edu email → receive code → verify
2. Swipe feed → verify 60fps smooth snapping
3. RSVP → verify count + animation
4. Follow club → verify feed prioritization
5. Share event → verify deep link opens correct screen
6. Push notification → verify delivery + tap opens event
7. Map → verify UCR pins with correct locations
8. Calendar → verify events on correct days
