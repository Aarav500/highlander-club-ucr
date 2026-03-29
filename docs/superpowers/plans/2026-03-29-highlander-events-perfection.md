# Highlander Events — App Perfection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Highlander Events mobile app by adding a TikTok-style vertical feed, a Create Event screen for club officers, and fixing broken admin panel navigation.

**Architecture:** All changes are in `apps/mobile` (React Native / Expo SDK 55). The backend is unchanged — all required API endpoints already exist. Three independent areas: (1) new `create-event.tsx` modal screen, (2) full overhaul of `(tabs)/index.tsx` feed, (3) targeted fixes to `admin-panel/[id].tsx` and `profile.tsx`.

**Tech Stack:** Expo SDK 55, React Native 0.83.2, expo-router, expo-haptics (new), @react-native-community/datetimepicker (new), TypeScript, existing `services/api.ts`

**TypeScript check command:** `cd apps/mobile && npx tsc --noEmit`
**Start dev server:** `cd apps/mobile && npx expo start`

---

## File Map

| File | Change |
|------|--------|
| `apps/mobile/package.json` | Add `expo-haptics`, `@react-native-community/datetimepicker` |
| `apps/mobile/services/api.ts` | Add `upload.getPresignedUrl()` at line 180 |
| `apps/mobile/app/_layout.tsx` | Add `create-event` Stack.Screen at line 101 |
| `apps/mobile/app/create-event.tsx` | **New file** — full event creation/editing form |
| `apps/mobile/app/(tabs)/index.tsx` | Full overhaul — TikTok feed |
| `apps/mobile/app/admin-panel/[id].tsx` | Fix nav line 363, update Events tab |
| `apps/mobile/app/(tabs)/profile.tsx` | Wrap My Events cards in Pressable |

---

## Task 1: Install Dependencies + Add Upload API Helper

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/services/api.ts:179-180`

- [ ] **Step 1: Add new packages to package.json**

Open `apps/mobile/package.json`. After line 37 (`"react-native-worklets": "0.7.2"`), add two entries:

```json
"expo-haptics": "~13.0.1",
"@react-native-community/datetimepicker": "8.2.0",
```

Final dependency block (lines 11–38) should include these two new lines before the closing `}`.

- [ ] **Step 2: Install packages**

```bash
cd apps/mobile && npx expo install expo-haptics @react-native-community/datetimepicker
```

Expected: packages download, `package.json` versions updated to Expo SDK 55 compatible versions (expo install picks the right versions automatically).

- [ ] **Step 3: Add upload API helper to api.ts**

At the end of `apps/mobile/services/api.ts` (after line 179, the blank line after `points`), append:

```typescript
// Upload — S3 presigned URL generation
export const upload = {
  getPresignedUrl: (contentType: string) =>
    request(`/api/upload/presign?contentType=${encodeURIComponent(contentType)}`),
};
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add package.json services/api.ts && cd ../.. && git commit -m "feat(mobile): install expo-haptics, datetimepicker; add upload API helper"
```

---

## Task 2: Register create-event in Root Stack Navigator

**Files:**
- Modify: `apps/mobile/app/_layout.tsx:100-102`

- [ ] **Step 1: Add Stack.Screen for create-event**

In `apps/mobile/app/_layout.tsx`, after line 101 (`<Stack.Screen name="leaderboard" ...`), add:

```tsx
<Stack.Screen name="create-event" options={{ headerShown: false, presentation: 'modal' }} />
```

Full Stack block (lines 92–103) should now be:

```tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  <Stack.Screen name="event/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="club/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="club-dashboard/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="admin-panel/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="club-chat/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="event-ticket/[id]" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="leaderboard" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="create-event" options={{ headerShown: false, presentation: 'modal' }} />
  <Stack.Screen name="+not-found" />
</Stack>
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add apps/mobile/app/_layout.tsx && git commit -m "feat(mobile): register create-event modal in root stack navigator"
```

---

## Task 3: Create Event Screen — Skeleton + Header

**Files:**
- Create: `apps/mobile/app/create-event.tsx`

- [ ] **Step 1: Create the file with skeleton structure**

Create `apps/mobile/app/create-event.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors';
import { events as eventsApi, upload as uploadApi, clubs as clubsApi } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = ['Academic', 'Social', 'Sports', 'Career', 'Cultural', 'Greek Life'];

export default function CreateEventScreen() {
  const params = useLocalSearchParams();
  const clubId = params.clubId as string;
  const eventId = params.eventId as string | undefined;
  const router = useRouter();
  const theme = Colors.dark;
  const isEditMode = !!eventId;

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Social');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000)); // tomorrow
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 + 7200000)); // +2h
  const [location, setLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [ticketType, setTicketType] = useState<'free' | 'paid'>('free');
  const [ticketPrice, setTicketPrice] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [imageUrl, setImageUrl] = useState('');

  // UI state
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // Load existing event for edit mode
  useEffect(() => {
    if (!isEditMode) return;
    eventsApi.get(eventId!).then((evt: any) => {
      setTitle(evt.title || '');
      setCategory(evt.category || 'Social');
      setDescription(evt.description || '');
      setStartDate(new Date(evt.start_time));
      setEndDate(new Date(evt.end_time));
      setLocation(evt.location || '');
      setMaxAttendees(evt.max_attendees ? String(evt.max_attendees) : '');
      setTicketType(evt.ticket_price ? 'paid' : 'free');
      setTicketPrice(evt.ticket_price ? String(evt.ticket_price) : '');
      setStatus(evt.status || 'published');
      setImageUrl(evt.image_url || '');
    }).catch(() => {
      Alert.alert('Error', 'Could not load event details.');
      router.back();
    }).finally(() => setLoadingEdit(false));
  }, [eventId]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const { uploadUrl, publicUrl } = await uploadApi.getPresignedUrl('image/jpeg');
      const blob = await fetch(asset.uri).then(r => r.blob());
      await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      setImageUrl(publicUrl);
    } catch {
      Alert.alert('Upload Failed', 'Image is too large or upload failed. Try a smaller photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    if (endDate <= startDate) { setError('End time must be after start time.'); return; }

    setSubmitting(true);
    const payload = {
      club_id: clubId,
      title: title.trim(),
      category,
      description: description.trim(),
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: location.trim(),
      max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      ticket_type: ticketType,
      ticket_price: ticketType === 'paid' ? parseFloat(ticketPrice) : undefined,
      status,
      image_url: imageUrl || undefined,
    };

    try {
      if (isEditMode) {
        await eventsApi.update(eventId!, payload);
      } else {
        await eventsApi.create(payload);
      }
      router.back();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('403')) setError("You don't have permission to post events for this club.");
      else if (msg.includes('413')) setError('Image is too large. Try a smaller photo.');
      else if (msg.includes('400')) setError('Please fill in all required fields.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </Text>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.submitBtnText}>{isEditMode ? 'Save' : 'Post'}</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Error Banner */}
          {!!error && (
            <View style={[styles.errorBanner, { backgroundColor: theme.danger + '22', borderColor: theme.danger }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          )}

          {/* ── Section 1: Basics ── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>BASICS</Text>

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.titleInput, { color: theme.text }]}
              placeholder="Event title *"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
          </View>

          {/* Category pills */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => {
              const catColor = Colors.categories[cat as keyof typeof Colors.categories] || theme.primary;
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    { borderColor: catColor, backgroundColor: selected ? catColor : 'transparent' },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, { color: selected ? '#FFF' : catColor }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ── Section 2: Date & Time ── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DATE & TIME</Text>

          <View style={[styles.inputCard, { backgroundColor: theme.surface, gap: Spacing.sm }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Starts</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: theme.border }]}
                onPress={() => setShowStartDate(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontSize: FontSize.sm }}>
                  {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: theme.border }]}
                onPress={() => setShowStartTime(true)}
              >
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontSize: FontSize.sm }}>
                  {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: Spacing.xs }]}>Ends</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: theme.border }]}
                onPress={() => setShowEndDate(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontSize: FontSize.sm }}>
                  {endDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: theme.border }]}
                onPress={() => setShowEndTime(true)}
              >
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontSize: FontSize.sm }}>
                  {endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date/Time Pickers (rendered outside card to avoid layout issues) */}
          {showStartDate && (
            <DateTimePicker value={startDate} mode="date" display="default"
              onChange={(_, d) => { setShowStartDate(false); if (d) setStartDate(new Date(d.setHours(startDate.getHours(), startDate.getMinutes()))); }} />
          )}
          {showStartTime && (
            <DateTimePicker value={startDate} mode="time" display="default"
              onChange={(_, d) => { setShowStartTime(false); if (d) setStartDate(d); }} />
          )}
          {showEndDate && (
            <DateTimePicker value={endDate} mode="date" display="default"
              onChange={(_, d) => { setShowEndDate(false); if (d) setEndDate(new Date(d.setHours(endDate.getHours(), endDate.getMinutes()))); }} />
          )}
          {showEndTime && (
            <DateTimePicker value={endDate} mode="time" display="default"
              onChange={(_, d) => { setShowEndTime(false); if (d) setEndDate(d); }} />
          )}

          {/* ── Section 3: Location ── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>LOCATION</Text>

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.locationInput, { color: theme.text }]}
                placeholder="e.g. HUB 302, Bell Tower, Rec Center"
                placeholderTextColor={theme.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* ── Section 4: Media & Details ── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>MEDIA & DETAILS</Text>

          {/* Cover image */}
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color={theme.accent} />
            ) : imageUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={{ color: theme.success, fontSize: FontSize.sm, fontWeight: '600' }}>Cover image uploaded</Text>
                <Ionicons name="image" size={16} color={theme.textMuted} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: FontSize.sm }}>Add cover image (optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.inputCard, { backgroundColor: theme.surface, gap: Spacing.md }]}>
            {/* Max attendees */}
            <View style={styles.fieldRow}>
              <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.inlineInput, { color: theme.text, borderBottomColor: theme.border }]}
                placeholder="Max attendees (optional)"
                placeholderTextColor={theme.textMuted}
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                keyboardType="number-pad"
              />
            </View>

            {/* Ticket type */}
            <View style={styles.fieldRow}>
              <Ionicons name="ticket-outline" size={18} color={theme.textSecondary} />
              <View style={{ flex: 1, flexDirection: 'row', gap: Spacing.sm }}>
                {(['free', 'paid'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.toggleBtn, { borderColor: theme.border, backgroundColor: ticketType === t ? theme.primary : 'transparent' }]}
                    onPress={() => setTicketType(t)}
                  >
                    <Text style={{ color: ticketType === t ? '#FFF' : theme.textSecondary, fontSize: FontSize.sm, fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {ticketType === 'paid' && (
              <View style={styles.fieldRow}>
                <Ionicons name="cash-outline" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.inlineInput, { color: theme.text, borderBottomColor: theme.border }]}
                  placeholder="Price (e.g. 5.00)"
                  placeholderTextColor={theme.textMuted}
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            {/* Status */}
            <View style={styles.fieldRow}>
              <Ionicons name="eye-outline" size={18} color={theme.textSecondary} />
              <View style={{ flex: 1, flexDirection: 'row', gap: Spacing.sm }}>
                {([{ v: 'published', label: 'Publish Now' }, { v: 'draft', label: 'Save as Draft' }] as const).map(({ v, label }) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.toggleBtn, { flex: 1, borderColor: theme.border, backgroundColor: status === v ? theme.primary : 'transparent' }]}
                    onPress={() => setStatus(v)}
                  >
                    <Text style={{ color: status === v ? '#FFF' : theme.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  submitBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, minWidth: 60, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },

  scrollContent: { padding: Spacing.md, paddingBottom: 60 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: FontSize.sm },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },

  inputCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },

  titleInput: { fontSize: FontSize.xl, fontWeight: '700', minHeight: 44 },
  textArea: { fontSize: FontSize.md, minHeight: 80 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  categoryPill: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  categoryPillText: { fontSize: 12, fontWeight: '700' },

  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  locationInput: { flex: 1, fontSize: FontSize.md, minHeight: 44 },

  imagePicker: {
    height: 56, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inlineInput: { flex: 1, fontSize: FontSize.md, paddingVertical: Spacing.xs, borderBottomWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center' },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add apps/mobile/app/create-event.tsx && git commit -m "feat(mobile): add Create/Edit Event screen with full form"
```

---

## Task 4: Admin Panel — Fix Create Event Nav + Events Tab

**Files:**
- Modify: `apps/mobile/app/admin-panel/[id].tsx:362-367`

- [ ] **Step 1: Fix the Create Event button navigation**

In `apps/mobile/app/admin-panel/[id].tsx`, find lines 361–367 (the createEventBtn TouchableOpacity). Change:

```tsx
onPress={() => router.push(`/club/${id}` as any)}
```

to:

```tsx
onPress={() => router.push(`/create-event?clubId=${id as string}` as any)}
```

- [ ] **Step 2: Add Edit button to each event row in the Events tab**

In the same file, find lines 368–384 (the `dashboardData.events` map). Add an Edit button next to the existing chevron:

Replace the entire event row block (the `TouchableOpacity` that wraps `eventInfo` and the forward chevron) with:

```tsx
{(dashboardData.events || []).map((event: any) => (
  <View key={event.id} style={[styles.eventRow, { borderBottomColor: theme.border }]}>
    <TouchableOpacity
      style={styles.eventInfo}
      onPress={() => router.push(`/event/${event.id}` as any)}
    >
      <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>{event.title}</Text>
      <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
        {new Date(event.start_time).toLocaleDateString()} · {event.rsvp_count} RSVPs · {event.views} views
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.editBtn, { backgroundColor: theme.primary + '22' }]}
      onPress={() => router.push(`/create-event?clubId=${id as string}&eventId=${event.id}` as any)}
    >
      <Ionicons name="pencil" size={14} color={theme.primary} />
      <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit</Text>
    </TouchableOpacity>
  </View>
))}
```

- [ ] **Step 3: Add editBtn styles**

In the `StyleSheet.create` at the bottom of `admin-panel/[id].tsx`, after `eventMeta` style, add:

```tsx
editBtn: {
  flexDirection: 'row', alignItems: 'center', gap: 4,
  paddingHorizontal: Spacing.sm, paddingVertical: 6,
  borderRadius: BorderRadius.sm, marginLeft: Spacing.sm,
},
editBtnText: { fontSize: 12, fontWeight: '600' },
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/mobile/app/admin-panel/[id].tsx && git commit -m "fix(mobile): admin panel Create Event nav + add Edit buttons to Events tab"
```

---

## Task 5: Profile — Tappable My Events Cards

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Find the My Events tab render**

In `apps/mobile/app/(tabs)/profile.tsx`, search for the "My Events" tab section — it renders a list of user's RSVPed events. Find the event card wrapper (likely a `View` or `TouchableOpacity`).

```bash
cd apps/mobile && grep -n "My Events\|myEvents\|user_events\|rsvped" app/\(tabs\)/profile.tsx | head -20
```

- [ ] **Step 2: Wrap event cards in Pressable**

Find the event card render in the My Events tab. It will be rendering event items. Change the outer wrapper from `<View>` to:

```tsx
<TouchableOpacity
  key={event.id}
  onPress={() => router.push(`/event/${event.id}` as any)}
  activeOpacity={0.75}
>
  {/* existing card content unchanged */}
</TouchableOpacity>
```

Make sure `useRouter` is imported (it likely already is from existing navigation).

- [ ] **Step 3: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add apps/mobile/app/\(tabs\)/profile.tsx && git commit -m "fix(mobile): make My Events cards tappable in profile screen"
```

---

## Task 6: Feed — Extract HappeningNowBanner + Dynamic Height

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx:14-16, 252-328`

This task separates the `HappeningNowBanner` from `ListHeaderComponent` and sets up dynamic card height measurement — the foundation for TikTok snap scrolling.

- [ ] **Step 1: Add bannerHeight state + CARD_HEIGHT calculation**

At the top of `FeedScreen` component (after line 200 where state is declared), replace line 15:

```tsx
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
```

Remove this line entirely. It will be replaced by a dynamic calculation.

Add these new state and derived values inside the `FeedScreen` component (after the `recommended` state):

```tsx
const [bannerHeight, setBannerHeight] = useState(0);
const CARD_HEIGHT = SCREEN_HEIGHT - bannerHeight;
```

- [ ] **Step 2: Move HappeningNowBanner out of ListHeaderComponent**

In the `return` block (around line 252), change the structure from:

```tsx
<View style={styles.container}>
  <FlatList
    ...
    ListHeaderComponent={
      <>
        <HappeningNowBanner events={happeningNow} ... />
        {/* recommended section */}
        {/* section header */}
      </>
    }
    ...
  />
</View>
```

to:

```tsx
<View style={styles.container}>
  {/* Banner lives OUTSIDE FlatList to avoid Android pagingEnabled bug */}
  <View onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}>
    <HappeningNowBanner events={happeningNow} onPress={(e) => router.push(`/event/${e.id}` as any)} />
  </View>
  <FlatList
    data={events}
    keyExtractor={(item) => item.id}
    pagingEnabled
    snapToAlignment="start"
    showsVerticalScrollIndicator={false}
    ListHeaderComponent={null}
    ...
  />
</View>
```

Remove the `HappeningNowBanner` from `ListHeaderComponent`. Keep the "Recommended For You" carousel and "Upcoming Events" header inside `ListHeaderComponent` for now (they will be removed/reworked in Task 8).

- [ ] **Step 3: Update card style to use dynamic CARD_HEIGHT**

The `card` style in `StyleSheet.create` (around line 360) has `height: CARD_HEIGHT`. Since `CARD_HEIGHT` is now a variable (not a constant), it can't live in `StyleSheet.create`. Change the `renderItem` to pass height inline:

```tsx
renderItem={({ item }) => (
  <EventCard
    event={item}
    cardHeight={CARD_HEIGHT}
    onRSVP={() => handleRSVP(item.id)}
    onPress={() => router.push(`/event/${item.id}` as any)}
  />
)}
```

Add `cardHeight` prop to `EventCard`:

```tsx
function EventCard({ event, cardHeight, onRSVP, onPress }: {
  event: any; cardHeight: number; onRSVP: () => void; onPress: () => void
}) {
```

And in the card's style, replace `height: CARD_HEIGHT` with `height: cardHeight`.

Also remove `marginBottom: Spacing.md` from the card style — full-screen cards have no gap.

- [ ] **Step 4: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/mobile/app/\(tabs\)/index.tsx && git commit -m "feat(mobile): extract HappeningNow banner, add dynamic card height for feed"
```

---

## Task 7: Feed — Enable pagingEnabled + getItemLayout + Skeleton Loading

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Add pagingEnabled and getItemLayout to FlatList**

In the `FlatList` component, add these props:

```tsx
pagingEnabled
snapToAlignment="start"
showsVerticalScrollIndicator={false}
getItemLayout={(_, index) => ({
  length: CARD_HEIGHT,
  offset: CARD_HEIGHT * index,
  index,
})}
```

Remove `contentContainerStyle={{ paddingBottom: Spacing.xxl }}` — full-screen cards need no padding.

- [ ] **Step 2: Replace ActivityIndicator loading state with skeleton cards**

Find the loading state (around lines 243–249). Replace the `ActivityIndicator` block with skeleton cards:

```tsx
if (loading || CARD_HEIGHT === 0) {
  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      {[0, 1, 2].map(i => (
        <SkeletonCard key={i} height={SCREEN_HEIGHT / 3} />
      ))}
    </View>
  );
}
```

Add `SkeletonCard` component above `HappeningNowBanner`:

```tsx
function SkeletonCard({ height }: { height: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View style={[styles.skeletonCard, { height, opacity }]} />
  );
}
```

Add to `StyleSheet.create`:

```tsx
skeletonCard: { backgroundColor: Colors.dark.surface, marginBottom: 2 },
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add apps/mobile/app/\(tabs\)/index.tsx && git commit -m "feat(mobile): pagingEnabled feed + getItemLayout + skeleton loading"
```

---

## Task 8: Feed — Full-Screen Card Layout Redesign + Right Rail

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx` — `EventCard` component and styles

This is the biggest visual change: cards become full-screen TikTok-style with an image background, gradient overlay, and a right-rail action column.

- [ ] **Step 1: Add onMomentumScrollEnd + haptics + swipe hint state**

At the top of `FeedScreen`, add:

```tsx
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inside FeedScreen component:
const [showSwipeHint, setShowSwipeHint] = useState(false);
const swipeHintAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  AsyncStorage.getItem('@highlander/feed_swipe_hint_shown').then(val => {
    if (!val) setShowSwipeHint(true);
  });
}, []);

const handleMomentumScrollEnd = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (showSwipeHint) {
    Animated.timing(swipeHintAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      setShowSwipeHint(false);
      AsyncStorage.setItem('@highlander/feed_swipe_hint_shown', 'true');
    });
  }
}, [showSwipeHint]);
```

Pass `onMomentumScrollEnd={handleMomentumScrollEnd}` to `FlatList`.

- [ ] **Step 2: Add friends lazy-load via onViewableItemsChanged**

Add to `FeedScreen`:

```tsx
const [friendsMap, setFriendsMap] = useState<Record<string, number>>({});

const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
  const visible = viewableItems[0]?.item;
  if (!visible) return;
  eventsApi.friends(visible.id).then((list: any[]) => {
    setFriendsMap(prev => ({ ...prev, [visible.id]: list.length }));
  }).catch(() => {});
}, []);

const viewabilityConfig = { itemVisiblePercentThreshold: 80 };
```

Pass to `FlatList`:
```tsx
onViewableItemsChanged={onViewableItemsChanged}
viewabilityConfig={viewabilityConfig}
```

Also pass `friendsCount={friendsMap[item.id] || 0}` to `EventCard` in `renderItem`.

- [ ] **Step 3: Rewrite EventCard as full-screen TikTok card**

Replace the entire `EventCard` function with:

```tsx
function EventCard({
  event, cardHeight, friendsCount, onRSVP, onPress,
}: {
  event: any; cardHeight: number; friendsCount: number; onRSVP: () => void; onPress: () => void;
}) {
  const router = useRouter();
  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || Colors.dark.primary;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleRSVPPress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onRSVP();
  };

  const handleShare = async () => {
    const { Share } = await import('react-native');
    Share.share({
      message: `Check out "${event.title}" at UCR! 🎉\n${new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}\nhighlanderevents://event/${event.id}`,
      title: event.title,
    });
  };

  return (
    <TouchableOpacity style={[styles.card, { height: cardHeight }]} onPress={onPress} activeOpacity={0.98}>
      {/* Background image or color */}
      {event.image_url ? (
        <ImageBackground source={{ uri: event.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: catColor + '33', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="calendar" size={80} color={catColor + '55'} />
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'transparent', 'transparent', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.2, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top strip */}
      <View style={styles.cardTop}>
        <View style={[styles.categoryPill, { backgroundColor: catColor + 'CC' }]}>
          {event.isRecommended && <Ionicons name="sparkles" size={10} color="#FFF" style={{ marginRight: 3 }} />}
          <Text style={styles.categoryText}>{event.category || 'Event'}</Text>
        </View>
        <CountdownTimer startTime={event.start_time} />
      </View>

      {/* Right rail */}
      <View style={styles.rightRail}>
        {/* RSVP */}
        <View style={styles.railItem}>
          <TouchableOpacity style={styles.railBtn} onPress={handleRSVPPress} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={event.user_rsvped ? 'heart' : 'heart-outline'}
                size={28}
                color={event.user_rsvped ? '#FF6B6B' : '#FFF'}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.railCount}>{event.rsvp_count}</Text>
        </View>

        {/* Calendar tab shortcut */}
        <View style={styles.railItem}>
          <TouchableOpacity style={styles.railBtn} onPress={() => router.push('/(tabs)/calendar' as any)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Share */}
        <View style={styles.railItem}>
          <TouchableOpacity style={styles.railBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Friends going (only if > 0) */}
        {friendsCount > 0 && (
          <View style={styles.railItem}>
            <TouchableOpacity style={styles.railBtn} onPress={onPress} activeOpacity={0.8}>
              <Ionicons name="people" size={24} color="#4ADE80" />
            </TouchableOpacity>
            <Text style={[styles.railCount, { color: '#4ADE80' }]}>{friendsCount}</Text>
          </View>
        )}
      </View>

      {/* Bottom overlay */}
      <View style={styles.cardBottom}>
        <TouchableOpacity onPress={() => router.push(`/club/${event.club_id}` as any)}>
          <Text style={styles.clubName}>{event.club_name}</Text>
        </TouchableOpacity>
        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.metaText}>
            {new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          {event.location ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="location-outline" size={13} color={Colors.dark.accent} />
              <Text style={[styles.metaText, { color: Colors.dark.accent }]} numberOfLines={1}>{event.location}</Text>
            </>
          ) : null}
        </View>
        {/* Attendee stack */}
        <View style={styles.attendeeRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.avatar, { marginLeft: i * -8, backgroundColor: catColor, zIndex: 3 - i }]}>
              <Ionicons name="person" size={9} color="#FFF" />
            </View>
          ))}
          <Text style={styles.attendeeText}>{event.rsvp_count}+ attending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 4: Add swipe hint overlay to FeedScreen return block**

After the `FlatList`, inside the outer `<View style={styles.container}>`, add the swipe hint:

```tsx
{showSwipeHint && (
  <Animated.View style={[styles.swipeHint, { opacity: swipeHintAnim }]} pointerEvents="none">
    <Ionicons name="chevron-up" size={24} color="rgba(255,255,255,0.8)" />
    <Text style={styles.swipeHintText}>Swipe up for next event</Text>
  </Animated.View>
)}
```

- [ ] **Step 5: Update StyleSheet with new card and rail styles**

Replace the card-related styles in `StyleSheet.create` with:

```tsx
// Card
card: { overflow: 'hidden', backgroundColor: Colors.dark.surface },
cardTop: {
  position: 'absolute', top: 52, left: Spacing.md, right: Spacing.md + 64,
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  zIndex: 10,
},
categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
categoryText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

// Right rail
rightRail: {
  position: 'absolute', right: Spacing.md, bottom: 120,
  alignItems: 'center', gap: Spacing.md, zIndex: 10,
},
railItem: { alignItems: 'center', gap: 3 },
railBtn: {
  width: 48, height: 48, borderRadius: 24,
  backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
},
railCount: { color: '#FFF', fontSize: 12, fontWeight: '700' },

// Bottom overlay
cardBottom: {
  position: 'absolute', left: Spacing.md, right: 72, bottom: Spacing.xl,
  zIndex: 10, gap: 5,
},
clubName: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
eventTitle: { color: '#FFFFFF', fontSize: FontSize.xxl, fontWeight: '900', lineHeight: 32 },
metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'nowrap' },
metaText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
metaDot: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
attendeeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
avatar: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)' },
attendeeText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginLeft: Spacing.sm },

// Swipe hint
swipeHint: {
  position: 'absolute', bottom: 90, alignSelf: 'center',
  alignItems: 'center', gap: 4, zIndex: 20,
},
swipeHintText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
```

Remove old card styles: `categoryBar`, `cardImageBg`, `cardGradient`, `cardContent`, `actionRow`, `rsvpBtn`, `rsvpBtnActive`, `rsvpText`, `rsvpTextActive`.

- [ ] **Step 6: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors (fix any type errors found).

- [ ] **Step 7: Commit**

```bash
cd ../.. && git add apps/mobile/app/\(tabs\)/index.tsx && git commit -m "feat(mobile): full-screen TikTok card layout with right rail, friends lazy load, haptics, swipe hint"
```

---

## Task 9: Feed — Inline Recommended Injection + Remove Old Header

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx` — `loadFeed`, `ListHeaderComponent`, feed data

- [ ] **Step 1: Build combined feed array with inline recommended injection**

In `loadFeed`, replace the `setEvents(feed)` and `setRecommended(recs)` calls with a combined list builder:

```tsx
const loadFeed = async () => {
  setLoading(true);
  try {
    const [feed, live, recs] = await Promise.all([
      eventsApi.list().catch(() => []),
      eventsApi.happeningNow().catch(() => []),
      eventsApi.recommended().catch(() => []),
    ]);
    setHappeningNow(live);

    // Inject recommended events inline every 5 chronological events
    const recIds = new Set((recs as any[]).map((r: any) => r.id));
    const combined: any[] = [];
    const recQueue = (recs as any[]).map((r: any) => ({ ...r, isRecommended: true }));
    let recIdx = 0;
    (feed as any[]).forEach((evt: any, i: number) => {
      if (!recIds.has(evt.id)) combined.push(evt);
      // Insert one recommended event every 5 items
      if ((combined.length) % 5 === 4 && recIdx < recQueue.length) {
        combined.push(recQueue[recIdx++]);
      }
    });
    // Append any remaining recommended events not yet inserted
    while (recIdx < recQueue.length) combined.push(recQueue[recIdx++]);
    setEvents(combined);
  } catch (err) {
    console.error('Feed load error:', err);
  } finally {
    setLoading(false);
  }
};
```

Remove the `recommended` state entirely (`const [recommended, setRecommended] = useState<any[]>([])`).

- [ ] **Step 2: Remove the Recommended carousel from ListHeaderComponent**

In `ListHeaderComponent`, delete the entire `{recommended.length > 0 && ...}` block (the horizontal ScrollView carousel). Keep only the "Upcoming Events" section header:

```tsx
ListHeaderComponent={
  events.length > 0 ? (
    <View style={[styles.sectionHeader, { paddingTop: Spacing.sm }]}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <Text style={styles.sectionCount}>{events.length}</Text>
    </View>
  ) : null
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add apps/mobile/app/\(tabs\)/index.tsx && git commit -m "feat(mobile): inline recommended event injection every 5 cards, remove carousel header"
```

---

## Task 10: Final TypeScript Check + Full Commit

- [ ] **Step 1: Full TypeScript check across all modified files**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: zero errors. Fix any remaining type errors before proceeding.

- [ ] **Step 2: Verify imports are clean**

Check that all imports are used and no unused imports remain in modified files:

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep "is declared but"
```

Expected: empty output.

- [ ] **Step 3: Final commit**

```bash
cd ../.. && git add -A && git commit -m "feat(mobile): Highlander Events app perfection — TikTok feed, Create Event, admin fixes

- TikTok-style full-screen paginated vertical feed with pagingEnabled
- Dynamic banner height via onLayout + getItemLayout for correct snap on iOS and Android
- Full-screen card with image background, gradient overlay, right rail (RSVP/share/calendar/friends)
- Recommended events injected inline every 5 cards with sparkle badge
- Lazy friends count fetch via onViewableItemsChanged
- Haptic feedback on card settle
- Swipe hint on first launch (AsyncStorage flag)
- Skeleton loading while feed loads
- New Create/Edit Event screen with all form fields, S3 image upload, DateTimePicker
- Admin panel Create Event nav fixed, Events tab has Edit buttons
- Profile My Events cards are now tappable
- Added expo-haptics, @react-native-community/datetimepicker, upload API helper

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Manual Verification Checklist

After implementation, verify these flows:

**Feed:**
- [ ] Launch app → see skeleton cards while loading
- [ ] After load → HappeningNow banner visible at top (if any live events)
- [ ] Swipe up → card snaps exactly to next event, haptic fires
- [ ] Swipe up hint visible on first launch, disappears after first swipe, never reappears
- [ ] Every ~5th card has ✨ sparkle in category pill (recommended)
- [ ] RSVP heart in right rail animates and toggles
- [ ] Share opens native share sheet with event title and deep link
- [ ] Calendar icon navigates to Calendar tab

**Create Event:**
- [ ] Admin panel → Events tab → "Create New Event" opens create-event modal
- [ ] Fill title, pick category, set dates, enter location, tap Post → event appears on feed
- [ ] Set status to Draft → event NOT visible on feed, but visible in admin Events tab
- [ ] Admin panel → Events tab → tap Edit → form prefills with event data
- [ ] Tap Save → changes reflected on event detail

**Profile:**
- [ ] My Events tab → tap any event card → opens event detail screen
