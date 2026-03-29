import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors';
import { events as eventsApi, upload as uploadApi } from '../services/api';
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
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 + 7200000));
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
      setEndDate(new Date(evt.end_time || evt.start_time));
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
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const { uploadUrl, publicUrl } = await uploadApi.getPresignedUrl('image/jpeg');
      const blob = await fetch(asset.uri).then(r => r.blob());
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });
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
    const payload: any = {
      club_id: clubId,
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: location.trim() || undefined,
      status,
    };
    if (maxAttendees) payload.max_attendees = parseInt(maxAttendees, 10);
    if (ticketType === 'paid' && ticketPrice) payload.ticket_price = parseFloat(ticketPrice);
    if (imageUrl) payload.image_url = imageUrl;

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

          {showStartDate && (
            <DateTimePicker value={startDate} mode="date" display="default"
              onChange={(_, d) => {
                setShowStartDate(false);
                if (d) {
                  const updated = new Date(d);
                  updated.setHours(startDate.getHours(), startDate.getMinutes());
                  setStartDate(updated);
                }
              }} />
          )}
          {showStartTime && (
            <DateTimePicker value={startDate} mode="time" display="default"
              onChange={(_, d) => { setShowStartTime(false); if (d) setStartDate(d); }} />
          )}
          {showEndDate && (
            <DateTimePicker value={endDate} mode="date" display="default"
              onChange={(_, d) => {
                setShowEndDate(false);
                if (d) {
                  const updated = new Date(d);
                  updated.setHours(endDate.getHours(), endDate.getMinutes());
                  setEndDate(updated);
                }
              }} />
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
                    style={[
                      styles.toggleBtn,
                      { borderColor: theme.border, backgroundColor: ticketType === t ? theme.primary : 'transparent' },
                    ]}
                    onPress={() => setTicketType(t)}
                  >
                    <Text style={{
                      color: ticketType === t ? '#FFF' : theme.textSecondary,
                      fontSize: FontSize.sm, fontWeight: '600', textTransform: 'capitalize',
                    }}>{t}</Text>
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
                {([
                  { v: 'published' as const, label: 'Publish Now' },
                  { v: 'draft' as const, label: 'Save as Draft' },
                ]).map(({ v, label }) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.toggleBtn,
                      { flex: 1, borderColor: theme.border, backgroundColor: status === v ? theme.primary : 'transparent' },
                    ]}
                    onPress={() => setStatus(v)}
                  >
                    <Text style={{
                      color: status === v ? '#FFF' : theme.textSecondary,
                      fontSize: FontSize.xs, fontWeight: '600',
                    }}>{label}</Text>
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
    paddingTop: 60,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  submitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },

  scrollContent: { padding: Spacing.md, paddingBottom: 60 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: FontSize.sm },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  inputCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  titleInput: { fontSize: FontSize.xl, fontWeight: '700', minHeight: 44 },
  textArea: { fontSize: FontSize.md, minHeight: 80 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  categoryPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  categoryPillText: { fontSize: 12, fontWeight: '700' },

  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  locationInput: { flex: 1, fontSize: FontSize.md, minHeight: 44 },

  imagePicker: {
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inlineInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
});
