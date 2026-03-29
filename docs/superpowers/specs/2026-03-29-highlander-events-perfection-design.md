# Highlander Events — App Perfection Design Spec
**Date:** 2026-03-29
**Status:** Approved
**Scope:** Mobile app (`apps/mobile`) — frontend only, no backend changes required

---

## Context

The Highlander Events app is a UCR campus events discovery platform targeting UCR students and club officers. The backend (`apps/api-node`) is production-ready with 20+ fully implemented features including UCR CAS SSO, RSVP, club follow, push notifications, AI recommendations, ticketing, and gamification.

Three confirmed gaps in the mobile frontend prevent the app from being production-ready:

1. **No TikTok-style feed** — `FlatList` uses regular scroll; cards are 65% screen height
2. **No Create Event screen** — Backend API fully supports it, `api.ts` has `events.create()` and `events.update()`, but no frontend form exists
3. **Broken admin navigation** — "Create Event" button in admin panel navigates to club dashboard (analytics) instead of a creation form

---

## Area 1: Create Event Screen

### File
`apps/mobile/app/create-event.tsx` — modal presentation

### Navigation Entry Points
- Admin panel "Create Event" button → `router.push('/create-event?clubId=...')`
- Admin panel Events tab, per-event "Edit" button → `router.push('/create-event?clubId=...&eventId=...')`

### Mode Detection
- If `eventId` param is present: prefill form via `eventsApi.get(eventId)`, submit calls `eventsApi.update()`
- If no `eventId`: empty form, submit calls `eventsApi.create()`

### Form Fields (maps directly to `POST /api/events` schema)

**Step 1 — Basics**
- Title (text input, required)
- Category (pill selector: Academic, Social, Sports, Career, Cultural, Greek Life)
- Description (multiline text area, optional)

**Step 2 — Date & Time**
- Start date + time (native `DateTimePicker`)
- End date + time (native `DateTimePicker`)
- Validation: end must be after start

**Step 3 — Location**
- Location name (text input, e.g. "HUB 302", optional)
- Lat/lng: tap UCR campus map to drop pin (optional, reuses existing Leaflet map component)

**Step 4 — Media & Details**
- Cover image (ImagePicker → S3 presigned upload via existing `uploadApi.getPresignedUrl()` flow)
- Max attendees (number input, optional)
- Ticket type toggle: Free / Paid (if Paid, price field appears)
- Status toggle: Publish Now / Save as Draft

### Submission
- `POST /api/events` with `club_id` from route param
- On success: `router.back()` to admin panel
- On error: inline error message below submit button

### Authorization
Backend already enforces club admin check (president, vice_president, officer). Frontend shows the Create Event button only when `userRole` is one of those three roles (same logic already used for admin panel visibility in `club/[id].tsx`).

---

## Area 2: TikTok-Style Vertical Feed

### File Modified
`apps/mobile/app/(tabs)/index.tsx`

### FlatList Changes
```
pagingEnabled: true
snapToAlignment: 'start'
decelerationRate: 'fast'
showsVerticalScrollIndicator: false
Card height: SCREEN_HEIGHT (100% — replaces current SCREEN_HEIGHT * 0.65)
Card marginBottom: 0 (removed)
```

### Full-Screen Card Layout
Cards use absolute positioning to layer content over the event image:

**Background:** Event image fills entire card (`resizeMode: 'cover'`), fallback to placeholder with event icon

**Top strip:**
- Category pill (colored background, top-left)
- Countdown timer "Starts in 2h 30m" (top-right) — or "LIVE" pulsing badge if happening now

**Right rail** (fixed vertical column, right edge, Instagram Reels style):
- ❤️ RSVP button + RSVP count — heart fill animation on tap (existing logic reused)
- 📅 Save to calendar icon
- ↗️ Share icon (calls existing `Share.share()`)
- 👥 Friends count icon (shown only if friends are attending)

**Bottom overlay** (gradient from transparent → `rgba(0,0,0,0.85)`, starts at 55% of card height):
- Club avatar circle + club name (tappable → `/club/{id}`)
- Event title (large, bold, white)
- Date · Location line (small, muted white)
- Attendee avatar stack + count

**Swipe hint:** Up-arrow chevron at bottom center, fades out after first swipe (`AsyncStorage` flag)

### Haptics
`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` called in `onMomentumScrollEnd`

### Header Sections (above feed)
- "Happening Now" horizontal scroll row: retained as sticky header pinned above the `FlatList`
- "Recommended For You" carousel: **removed** from header — recommended events are injected inline into the feed list and flagged with a ✨ sparkle on their category pill

### No New Dependencies
`expo-haptics` is already in the Expo SDK; `pagingEnabled` is a native `FlatList` prop.

---

## Area 3: Admin Panel Fix + Polish Pass

### Admin Panel (`apps/mobile/app/admin-panel/[id].tsx`)

**Fix 1 — Create Event navigation:**
```
Before: router.push(`/club-dashboard/${id}`)
After:  router.push(`/create-event?clubId=${id}`)
```

**Fix 2 — Events tab:**
- Fetch and display the club's own events via `eventsApi.list({ clubId: id })`
- Each event row has an "Edit" button → `router.push('/create-event?clubId=${id}&eventId=${event.id}')`
- Replace the current placeholder navigation with the actual event list

### Profile Screen (`apps/mobile/app/(tabs)/profile.tsx`)
- "My Events" tab: each event card becomes tappable → `router.push('/event/${event.id}')`
- Currently cards render event data but are not wrapped in a `Pressable`

### Feed Screen Polish
- Remove "Recommended For You" section header (now inline)
- Remove `marginBottom` from cards

### General
- All modal screens: verify `router.back()` works correctly on dismiss
- Feed: replace blank flash on initial load with skeleton placeholder cards (3 gray animated cards while data loads)

---

## Files Changed

| File | Change Type |
|------|-------------|
| `app/create-event.tsx` | **New** — event creation/editing form |
| `app/(tabs)/index.tsx` | **Modified** — TikTok feed overhaul |
| `app/admin-panel/[id].tsx` | **Modified** — nav fix, events tab, edit buttons |
| `app/(tabs)/profile.tsx` | **Modified** — tappable event cards |
| `app/_layout.tsx` | **Modified** — add `create-event` to stack navigator |

## Files NOT Changed
- All backend files (`apps/api-node/`) — no changes needed
- `services/api.ts` — all required functions already exist
- `services/notifications.ts` — no changes needed
- `constants/Colors.ts` — no changes needed
- All other screens — no changes needed

---

## Success Criteria

- [ ] Club officer can open admin panel, tap "Create Event", fill form, and see new event appear on the feed
- [ ] Feed swipes full-screen — one card per swipe, haptic on settle
- [ ] Recommended events appear inline in feed with ✨ badge, not as separate carousel
- [ ] Profile "My Events" cards are tappable
- [ ] Admin panel Events tab shows club's real events with Edit buttons
- [ ] No regressions on auth, RSVP, follow, calendar, map, search, notifications
