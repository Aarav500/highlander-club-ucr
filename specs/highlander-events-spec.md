# App Spec: Highlander Events

> UCR Club Events Discovery App — Mobile-first (React Native + Expo)

---

## 1. Product Summary

**Name:** Highlander Events
**Tagline:** Never miss a UCR event again.
**Target Users:** UCR students (verified @ucr.edu), club officers, student organizations.

**Description:**
Highlander Events is a mobile app for University of California, Riverside students to discover, follow, and RSVP to campus club events through a TikTok-style vertical swipeable feed. Club officers post and promote events with images/videos, while students filter, search, and get push notifications for events they care about. The app builds campus community by making events discoverable and social.

---

## Release Scope

### V1 — Ship This (MVP)
Vertical event feed, RSVP, club follow, filters/search, calendar, map, deep links, push notifications (reminders + "new from followed clubs"), "Happening Now", countdown, basic friend activity, SSO with @ucr.edu.

### V1.1 — Fast Follow
Club dashboard charts, photo gallery, weekly digest, advanced analytics.

### V2 — Stretch
AI recommendations (OpenAI), club chat, ticketing, rewards/gamification.

---

## 2. Core User Stories

| # | Role | Action | Outcome | Release |
|---|------|--------|---------|---------|
| 1 | Student | Swipe through a vertical event feed | Discover events happening on campus | V1 |
| 2 | Student | Follow clubs I'm interested in | See their events first in my feed | V1 |
| 3 | Student | Tap "I'm Going" on an event | RSVP and see who else is attending | V1 |
| 4 | Student | Filter events by category/date/location | Find exactly what I'm looking for | V1 |
| 5 | Student | Search for events or clubs by keyword | Quickly find specific content | V1 |
| 6 | Student | View events on a calendar | Plan my week around campus events | V1 |
| 7 | Student | View events on a campus map | See where events are physically located | V1 |
| 8 | Student | Share an event with friends via deep link | Friends open the event directly in-app | V1 |
| 9 | Student | Get push notifications | Know when events are starting or new events posted | V1 |
| 10 | Student | See "Happening Now" events | Join events that are currently live | V1 |
| 11 | Student | See friend activity | Know when friends are going to events | V1 |
| 12 | Student | Browse post-event photo gallery | See what happened at events I missed | V1.1 |
| 13 | Club Officer | Create and edit events with images/videos | Promote my club's events to the student body | V1 |
| 14 | Club Officer | View club dashboard analytics | See event views, RSVPs, and engagement metrics | V1.1 |
| 15 | Club Officer | Manage club profile | Keep club info and branding up to date | V1 |

---

## 3. Data Model (Postgres)

### Table: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL, CHECK (email LIKE '%@ucr.edu') | Must be @ucr.edu |
| name | VARCHAR(255) | NOT NULL | Display name |
| avatar_url | TEXT | | S3 URL |
| push_token | TEXT | | Expo push token |
| verified | BOOLEAN | DEFAULT false | Email verified |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `login_codes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| email | VARCHAR(255) | NOT NULL | |
| code | VARCHAR(6) | NOT NULL | 6-digit code |
| expires_at | TIMESTAMPTZ | NOT NULL | 10 min expiry |
| used | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `clubs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | Club name |
| description | TEXT | | About the club |
| logo_url | TEXT | | S3 URL |
| cover_url | TEXT | | Banner image |
| category | VARCHAR(50) | NOT NULL | Academic, Social, Sports, Career, Cultural, Greek Life |
| instagram | VARCHAR(255) | | Social link |
| created_by | UUID | FK → users.id | Founding officer |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `club_members`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | FK → users.id, PK | |
| club_id | UUID | FK → clubs.id, PK | |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'member' | 'admin' or 'member' |
| joined_at | TIMESTAMPTZ | DEFAULT now() | |

> **Auth rule:** "officer only" APIs check `club_members.role = 'admin'` consistently in middleware. No separate role column on `users`.

### Table: `events`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| club_id | UUID | FK → clubs.id, NOT NULL | Hosting club |
| title | VARCHAR(255) | NOT NULL | Event title |
| description | TEXT | | Event details |
| image_url | TEXT | | S3 URL for cover image |
| video_url | TEXT | | Optional promo video |
| location | VARCHAR(255) | | Venue name |
| lat | DECIMAL(10,7) | | UCR campus coordinates |
| lng | DECIMAL(10,7) | | UCR campus coordinates |
| category | VARCHAR(50) | NOT NULL | Event category |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'published' | draft, published, cancelled |
| max_attendees | INTEGER | | NULL = unlimited |
| views | INTEGER | DEFAULT 0 | Incremented on detail view |
| start_time | TIMESTAMPTZ | NOT NULL | Event start |
| end_time | TIMESTAMPTZ | NOT NULL | Event end |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `rsvps`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | FK → users.id, PK | |
| event_id | UUID | FK → events.id, PK | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `follows`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | FK → users.id, PK | |
| club_id | UUID | FK → clubs.id, PK | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `friendships`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | FK → users.id, PK | |
| friend_id | UUID | FK → users.id, PK | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `event_photos` (V1.1)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| event_id | UUID | FK → events.id | |
| user_id | UUID | FK → users.id | Uploaded by |
| photo_url | TEXT | NOT NULL | S3 URL |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Indexes

- `events(start_time)` — feed sorting + "happening now" queries
- `events(category)` — category filtering
- `events(club_id)` — club event listings
- `events(status)` — exclude draft/cancelled from public queries
- `rsvps(event_id)` — attendee counts
- `follows(user_id)` — personalized feed

---

## 4. API Endpoints

| Method | Path | Auth? | Notes |
|--------|------|-------|-------|
| GET | /health | No | Health check |
| POST | /api/auth/login | No | Send verification code to @ucr.edu (throttled) |
| POST | /api/auth/verify | No | Verify code → JWT |
| POST | /api/auth/logout | Yes | Invalidate token |
| GET | /api/events | Yes | Feed with filters (category, date, lat/lng, club_id). Only status='published' |
| GET | /api/events/happening-now | Yes | `start_time <= now <= end_time` ordered by start_time |
| GET | /api/events/:id | Yes | Full detail + increment views counter |
| GET | /api/events/:id/attendees | Yes | Attendee list |
| GET | /api/events/:id/friends | Yes | Subset of attendees who are current user's friends |
| POST | /api/events | Yes (admin) | Club admin only. Status defaults to 'published' |
| PUT | /api/events/:id | Yes (admin) | Club admin only. Can set status to draft/cancelled |
| DELETE | /api/events/:id | Yes (admin) | Soft delete (set status='cancelled') |
| POST | /api/events/:id/rsvp | Yes | Toggle RSVP. Check max_attendees if set |
| GET | /api/clubs | Yes | List clubs with filters |
| GET | /api/clubs/:id | Yes | Club profile + upcoming events + follower count |
| POST | /api/clubs | Yes | Create club (creator becomes admin) |
| POST | /api/clubs/:id/follow | Yes | Toggle follow |
| GET | /api/clubs/:id/dashboard | Yes (admin) | Officer analytics: views, RSVPs, followers (V1.1) |
| GET | /api/users/me | Yes | Current user profile |
| PUT | /api/users/me | Yes | Update profile |
| GET | /api/users/me/feed | Yes | Personalized feed (followed clubs first, then popular) |
| GET | /api/users/me/friends-activity | Yes | Events friends RSVP'd to + counts |
| POST | /api/notifications/register | Yes | Store Expo push token |
| GET | /api/search | Yes | Events + clubs search by keyword |
| POST | /api/events/:id/photos | Yes | Upload gallery photo (V1.1) |

---

## 5. Screens / Components

### Screen: Login (`(auth)/login`)
- **Purpose:** Sign in with UCR email.
- **Layout:** UCR branding → email input → "Send Code" button.

### Screen: Feed (`(tabs)/feed`)
- **Purpose:** Vertical swipeable event discovery (TikTok-style).
- **Implementation:** `FlatList` with `pagingEnabled`, `snapToAlignment="start"`, `decelerationRate="fast"`, `snapToInterval={screenHeight}`.
- **Layout:** "Happening Now" horizontal banner → vertical full-screen card stack.
- **Components:** `HappeningNowBanner`, `EventCard`, `RSVPButton`, `CountdownTimer`, `FilterBar`.

### Screen: Calendar (`(tabs)/calendar`)
- **Purpose:** Monthly/weekly event view.
- **Layout:** Calendar header with event dots → day event list.

### Screen: Map (`(tabs)/map`)
- **Purpose:** UCR campus map with event pins.
- **Implementation:** `react-native-maps` with UCR center (33.9737, -117.3281), colored pins per category.
- **Layout:** Full-screen map → bottom sheet detail on pin tap.

### Screen: Search (`(tabs)/search`)
- **Purpose:** Search events and clubs.
- **Layout:** Search bar → category pills → results list.

### Screen: Profile (`(tabs)/profile`)
- **Purpose:** User profile, followed clubs, RSVP'd events, friends.
- **Layout:** Avatar + name → tabs (My Events, Following, Friends).

### Screen: Event Detail (`event/[id]`)
- **Purpose:** Full event info, attendees, friend activity, gallery (V1.1).
- **Layout:** Cover image → details → "X friends are going" → attendees → share.

### Screen: Club Profile (`club/[id]`)
- **Purpose:** Club info and event listing.
- **Layout:** Banner → about → follow button → upcoming events.

### Screen: Club Dashboard (`club-dashboard`) — V1.1
- **Purpose:** Officer analytics (views, RSVPs, followers).

### Key Components
- `EventCard` — full-screen vertical card with image, title, club, countdown, RSVP, friend count.
- `RSVPButton` — animated heart/check with attendee count. Respects `max_attendees` ("Almost Full!" badge).
- `CountdownTimer` — client-side hook that ticks once per minute, formats "Starts in 2h 30m".
- `FilterBar` — horizontal scrollable category/date/location pills.
- `HappeningNowBanner` — calls `/api/events/happening-now`, shows top N horizontally.

### Design Direction
- **UCR brand:** Blue (#2D6CC0) + Gold (#F1AB00)
- **Dark mode default** — premium feel
- **Glassmorphism event cards** with blurred image backgrounds
- **Micro-animations** — RSVP heart pop, card transitions, countdown ticks
- **Typography** — Inter

---

## 6. Mobile Implementation Notes

### Push Notifications
- Use `expo-notifications` + `expo-device`
- Request permissions on first login
- Get token via `Notifications.getExpoPushTokenAsync()` → POST to `/api/notifications/register`
- Tapping notification deep-links to `event/[id]` via Expo Router
- Backend enqueues tokens + payload → hits Expo's HTTP push endpoint

### Deep Links
- Scheme: `highlanderevents://event/:id`
- Universal links fallback to web if/when web client is added
- Use Expo Router + Linking config

### Auth Flow
- Throttle `POST /api/auth/login` (rate limit per email)
- Codes stored in `login_codes` table with 10-min expiry
- Enforce `email LIKE '%@ucr.edu'` in validation AND DB constraint

---

## 7. Non-functional Requirements & Definition of Done

### Non-functional
- [ ] Mobile-first (Android + iOS via Expo)
- [ ] Feed card transitions < 16ms (60fps)
- [ ] All API responses < 500ms
- [ ] Push notifications delivered within 30s
- [ ] @ucr.edu email verification required (DB constraint)
- [ ] Environment variables for all secrets
- [ ] Images served via S3
- [ ] Auth throttling on login endpoint

### Definition of Done (V1)
- [ ] User stories 1–11, 13, 15 implemented and tested
- [ ] API endpoints return correct status codes and error formats
- [ ] Mobile app builds for both Android and iOS via Expo
- [ ] Push notifications working on physical devices
- [ ] Campus map shows UCR with accurate event pins
- [ ] Deep link sharing opens correct event in-app
- [ ] Event status (draft/published/cancelled) working correctly
- [ ] max_attendees enforced when set
- [ ] Friend activity showing on event cards
- [ ] No console errors in production build
