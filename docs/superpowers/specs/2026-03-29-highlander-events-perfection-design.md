# Highlander Events — App Perfection Design Spec
**Date:** 2026-03-29
**Status:** Approved (rev 2 — spec review fixes applied)
**Scope:** Mobile app (`apps/mobile`) — frontend only, no backend changes required

---

## Context

The Highlander Events app is a UCR campus events discovery platform targeting UCR students and club officers. The backend (`apps/api-node`) is production-ready with 20+ fully implemented features including UCR CAS SSO, RSVP, club follow, push notifications, AI recommendations, ticketing, and gamification.

Three confirmed gaps in the mobile frontend prevent the app from being production-ready:

1. **No TikTok-style feed** — `FlatList` uses regular scroll; cards are 65% screen height
2. **No Create Event screen** — Backend API fully supports it, `api.ts` has `events.create()` and `events.update()`, but no frontend form exists
3. **Broken admin navigation** — "Create Event" button in admin panel navigates to club dashboard (analytics) instead of a creation form

---

## New Dependencies

The following packages must be added to `apps/mobile/package.json` before implementation:

| Package | Purpose |
|---------|---------|
| `expo-haptics` | Haptic feedback on feed card settle |
| `@react-native-community/datetimepicker` | Native date/time pickers in Create Event form |

> `expo-haptics` is an Expo-maintained package compatible with SDK 55. `@react-native-community/datetimepicker` is the standard React Native date picker used with Expo managed workflow.

Also, `apps/mobile/services/api.ts` must be updated to add:

```typescript
upload: {
  getPresignedUrl: (contentType: string) =>
    request(`/api/upload/presign?contentType=${encodeURIComponent(contentType)}`),
}
```

This wraps the existing `GET /api/upload/presign` backend endpoint (already implemented in `apps/api-node`).

---

## Area 1: Create Event Screen

### File
`apps/mobile/app/create-event.tsx` — modal presentation

### Navigation Entry Points
- Admin panel "Create Event" button → `router.push('/create-event?clubId=' + (id as string))`
  where `id` is read from `useLocalSearchParams()` in `admin-panel/[id].tsx` and cast to `string`
- Admin panel Events tab, per-event "Edit" button → `router.push('/create-event?clubId=' + (id as string) + '&eventId=' + event.id)`

### Mode Detection
- Read `clubId` and `eventId` from `useLocalSearchParams()`. Both must be cast: `const clubId = params.clubId as string`
- If `eventId` is present: prefill form via `eventsApi.get(eventId)` on mount, submit calls `eventsApi.update(eventId, data)`
  - **Side effect accepted:** `GET /api/events/:id` increments the views counter. This is a known backend behavior and acceptable for now.
- If no `eventId`: empty form, submit calls `eventsApi.create({ ...data, club_id: clubId })`

### Form Fields (maps directly to `POST /api/events` schema)

**Step 1 — Basics**
- Title (text input, required)
- Category (pill selector: Academic, Social, Sports, Career, Cultural, Greek Life)
- Description (multiline text area, optional)

**Step 2 — Date & Time**
- Start date + time (`DateTimePicker` from `@react-native-community/datetimepicker`)
- End date + time (`DateTimePicker`)
- Client-side validation: end must be after start; show inline error if not

**Step 3 — Location**
- Location name (text input, e.g. "HUB 302", optional)
- Lat/lng: tap UCR campus map to drop pin (optional, reuses existing Leaflet map component from `map.tsx`)

**Step 4 — Media & Details**
- Cover image: `ImagePicker.launchImageLibraryAsync()` → call `uploadApi.getPresignedUrl('image/jpeg')` → `fetch(uploadUrl, { method: 'PUT', body: imageBlob })` → store `publicUrl` as `image_url` in form state
- Max attendees (number input, optional)
- Ticket type toggle: Free / Paid (if Paid, price field appears)
- Status toggle: **Publish Now** / **Save as Draft**
  - Draft events are only visible in the admin panel Events tab (not on the public feed, which filters to `status = 'published'` only). Officers can open the admin panel Events tab to find and edit their drafts.

### Submission
- `POST /api/events` (create) or `PUT /api/events/:id` (edit) with `club_id` from route param
- On success: `router.back()` to admin panel
- Error handling:
  - **400** — show inline form error "Please fill in all required fields"
  - **403** — show modal alert "You don't have permission to post events for this club" (this is the guard: the screen is only reachable from the admin panel, which is itself gated, but 403 handles any bypass)
  - **413** — show inline error "Image is too large. Try a smaller photo."
  - **5xx** — show inline error "Something went wrong. Please try again."

### Authorization
The Create Event screen is exclusively reachable from the admin panel, which already enforces that the user is a club admin (president, vice_president, or officer). The backend enforces the same check and returns 403 for unauthorized attempts. No additional client-side role check is needed inside `create-event.tsx` — the 403 error handler above is the safety net.

---

## Area 2: TikTok-Style Vertical Feed

### File Modified
`apps/mobile/app/(tabs)/index.tsx`

### New Dependency
`expo-haptics` — import as `import * as Haptics from 'expo-haptics'`

### Feed Architecture — Android-Safe Approach

**The "Happening Now" banner must NOT use `ListHeaderComponent`** — `pagingEnabled` on Android does not account for `ListHeaderComponent` height when calculating page snap boundaries, causing the first card to land mid-screen.

Instead:
```
<View style={{ flex: 1 }}>
  <HappeningNowBanner />              {/* fixed height, outside FlatList */}
  <FlatList
    data={feedEvents}
    pagingEnabled
    snapToAlignment="start"
    decelerationRate="fast"
    showsVerticalScrollIndicator={false}
    keyExtractor={...}
    renderItem={renderCard}
    onMomentumScrollEnd={handleSettle}
  />
</View>
```

Card height is measured dynamically using `onLayout` on the `HappeningNowBanner` wrapper:

```typescript
const [bannerHeight, setBannerHeight] = useState(0);
const cardHeight = SCREEN_HEIGHT - bannerHeight;

<HappeningNowBanner onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)} />
<FlatList
  data={feedEvents}
  getItemLayout={(_, index) => ({
    length: cardHeight,
    offset: cardHeight * index,
    index,
  })}
  ...
/>
```

When the "Happening Now" row has no current events it renders at height 0, so `cardHeight` equals `SCREEN_HEIGHT` automatically. Cards must not be rendered until `bannerHeight` has been set (show skeleton cards during this brief initial layout pass).

### FlatList Props
```
pagingEnabled: true
snapToAlignment: 'start'
showsVerticalScrollIndicator: false
Card height: SCREEN_HEIGHT - bannerHeight  (measured via onLayout — see above)
Card marginBottom: 0 (removed)
getItemLayout: required — see above (enables correct snap positions for all items)
```

> Do NOT set `decelerationRate` when using `pagingEnabled`. On iOS, `pagingEnabled` internally uses fast deceleration. On Android, setting `decelerationRate:'fast'` alongside `pagingEnabled` interferes with snap behavior. Omitting it produces correct results on both platforms.

### Full-Screen Card Layout
Cards use absolute positioning to layer content over the event image:

**Background:** Event image fills entire card (`resizeMode: 'cover'`), fallback placeholder with event icon

**Top strip:**
- Category pill (colored background, top-left)
- Countdown timer "Starts in 2h 30m" (top-right), or pulsing "LIVE" badge if happening now

**Right rail** (fixed vertical column, right edge):
- ❤️ RSVP button + count — heart fill animation on tap (existing logic reused)
- 📅 Calendar tab shortcut — tapping navigates to the Calendar tab (`router.push('/(tabs)/calendar')`), NOT device system calendar (avoids `expo-calendar` dependency)
- ↗️ Share icon — calls existing `Share.share()` with event deep link
- 👥 Friends going count — shown only for the **currently visible card**, fetched lazily via `onViewableItemsChanged` (calls `eventsApi.friends(id)` for the single visible event ID). Hidden on other cards until they become visible. Shows "0 friends" state as hidden (not rendered).

**Bottom overlay** (gradient from transparent → `rgba(0,0,0,0.85)`, starts at 55% card height):
- Club avatar circle + club name (tappable → `/club/{id}`)
- Event title (large, bold, white)
- Date · Location line (small, muted white)
- Attendee avatar stack + count

### Swipe Hint
- Up-arrow chevron at bottom center of first card
- AsyncStorage key: `@highlander/feed_swipe_hint_shown`
- On app launch, read this key; if not set, show hint. On first `onMomentumScrollEnd`, set key to `'true'` and fade out hint with `Animated.timing`

### Haptics
`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` called in `onMomentumScrollEnd`

### Recommended Events — Inline Injection
Remove the "Recommended For You" `ListHeaderComponent` carousel entirely.

Inject recommended events inline into the feed list using the following rule:
- Fetch both `eventsApi.list()` (chronological) and `eventsApi.recommended()` in parallel
- Build combined feed array: insert one recommended event every 5 chronological events (indices 4, 9, 14...), deduplicated by `event.id`
- Recommended events get `isRecommended: true` flag on their card data → renders a ✨ sparkle overlay on the category pill

### Skeleton Loading
While feed data loads (before first API response), render 3 skeleton cards:
- Gray animated gradient blocks (using `Animated.loop` + `Animated.timing` for shimmer)
- Same dimensions as real cards (SCREEN_HEIGHT - HAPPENING_NOW_BANNER_HEIGHT)
- No interaction

---

## Area 3: Admin Panel Fix + Polish Pass

### Admin Panel (`apps/mobile/app/admin-panel/[id].tsx`)

**Fix 1 — Create Event navigation:**
```typescript
// Before:
router.push(`/club-dashboard/${id}`)

// After (id comes from useLocalSearchParams(), already cast as string):
router.push(`/create-event?clubId=${id as string}`)
```

**Fix 2 — Events tab:**
- Fetch club's events on tab focus: `eventsApi.list({ clubId: id as string, status: 'all' })` — include drafts
  - Note: backend `GET /api/events` accepts a `clubId` filter param; add `status: 'all'` or omit status filter when fetching for admin view (may need backend to accept `status=all` param — if not, fetch both `published` and `draft` separately and merge)
  - **Alternative if backend doesn't support `status=all`:** fetch `clubsApi.get(id)` which returns `upcoming_events` array; for admin purposes this is sufficient for now
- Each event row shows: title, date, status badge (Published / Draft), RSVP count
- "Edit" button per row → `router.push('/create-event?clubId=${id as string}&eventId=${event.id}')`
- "Create Event" button at top of tab → `router.push('/create-event?clubId=${id as string}')`

### Profile Screen (`apps/mobile/app/(tabs)/profile.tsx`)
- "My Events" tab: wrap each event card in `<Pressable onPress={() => router.push('/event/' + event.id)}>`
- Add `activeOpacity` visual feedback on press

### Feed Screen Polish
- Remove `ListHeaderComponent` "Recommended For You" carousel (replaced by inline injection above)
- Remove `marginBottom` from event cards
- Skeleton loading on initial load (see Area 2)

### Root Layout (`apps/mobile/app/_layout.tsx`)
Add `create-event` to the stack navigator:
```typescript
<Stack.Screen name="create-event" options={{ presentation: 'modal', title: 'Create Event' }} />
```

---

## Files Changed

| File | Change Type |
|------|-------------|
| `app/create-event.tsx` | **New** — event creation/editing form |
| `app/(tabs)/index.tsx` | **Modified** — TikTok feed overhaul |
| `app/admin-panel/[id].tsx` | **Modified** — nav fix, events tab, edit buttons |
| `app/(tabs)/profile.tsx` | **Modified** — tappable event cards |
| `app/_layout.tsx` | **Modified** — add `create-event` to stack navigator |
| `services/api.ts` | **Modified** — add `upload.getPresignedUrl()` function |
| `package.json` | **Modified** — add `expo-haptics`, `@react-native-community/datetimepicker` |

---

## Success Criteria

- [ ] `expo-haptics` and `@react-native-community/datetimepicker` installed and importable
- [ ] `uploadApi.getPresignedUrl()` exists in `api.ts`
- [ ] Club officer can open admin panel → "Create Event" → fill form → event appears on feed
- [ ] Club officer can open admin panel → Events tab → tap "Edit" on an event → form prefills
- [ ] Draft events visible in admin panel Events tab, not on public feed
- [ ] Feed swipes full-screen on both iOS and Android — one card per swipe, haptic on settle
- [ ] "Happening Now" banner stays pinned above feed, does not interfere with snap
- [ ] Recommended events appear inline in feed (every 5th card) with ✨ badge
- [ ] Friends count shown only for currently visible card (lazy fetch)
- [ ] Swipe hint appears on first launch, disappears after first swipe, never reappears
- [ ] Profile "My Events" cards are tappable → navigate to event detail
- [ ] Admin panel Events tab shows real events (published + drafts) with Edit buttons
- [ ] No regressions on auth, RSVP, follow, calendar, map, search, notifications
