import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Image, Alert, Animated,
  ScrollView, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { events as eventsApi, users as usersApi } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

// ─── Happening Now Pill ─────────────────────────────────────────────────────
function HappeningNowBanner({ events, onPress }: { events: any[]; onPress: (e: any) => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (events.length === 0) return null;

  return (
    <View style={styles.happeningNow}>
      <View style={styles.happeningNowHeader}>
        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
        <Text style={styles.happeningNowTitle}>HAPPENING NOW</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.happeningScroll}>
        {events.map((event) => (
          <TouchableOpacity key={event.id} style={styles.happeningCard} onPress={() => onPress(event)} activeOpacity={0.8}>
            <View style={styles.happeningImage}>
              <Ionicons name="musical-notes" size={20} color={Colors.dark.accent} />
            </View>
            <Text style={styles.happeningName} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.happeningTime}>{new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Countdown Timer ────────────────────────────────────────────────────────
function CountdownTimer({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('NOW'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!timeLeft) return null;
  const isNow = timeLeft === 'NOW';

  return (
    <View style={[styles.countdown, isNow && styles.countdownNow]}>
      <Ionicons name={isNow ? 'radio' : 'time-outline'} size={12} color={isNow ? '#4ADE80' : '#FFF'} />
      <Text style={[styles.countdownText, isNow && { color: '#4ADE80' }]}>{isNow ? 'LIVE' : timeLeft}</Text>
    </View>
  );
}

// ─── Premium Event Card ─────────────────────────────────────────────────────
function EventCard({ event, onRSVP, onPress }: { event: any; onRSVP: () => void; onPress: () => void }) {
  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || Colors.dark.primary;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleRSVPPress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onRSVP();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* Category accent bar */}
      <View style={[styles.categoryBar, { backgroundColor: catColor }]} />

      {/* Event image / gradient background */}
      <View style={[styles.cardImageBg, { backgroundColor: catColor + '22' }]}>
        <Ionicons name="image" size={48} color={catColor + '44'} />
      </View>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(10,14,26,0.6)', 'rgba(10,14,26,0.95)']}
        locations={[0, 0.4, 1]}
        style={styles.cardGradient}
      />

      {/* Content overlay */}
      <View style={styles.cardContent}>
        {/* Top — category + countdown */}
        <View style={styles.cardTop}>
          <View style={[styles.categoryPill, { backgroundColor: catColor + '33', borderColor: catColor }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{event.category || 'Event'}</Text>
          </View>
          <CountdownTimer startTime={event.start_time} />
        </View>

        {/* Bottom — info */}
        <View style={styles.cardBottom}>
          {/* Club name */}
          <Text style={styles.clubName}>{event.club_name}</Text>

          {/* Title */}
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.dark.accent} />
              <Text style={[styles.metaText, { color: Colors.dark.accent }]}>{event.location || 'TBD'}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            {/* Attendees */}
            <View style={styles.attendeeRow}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.avatar, { marginLeft: i * -8, backgroundColor: catColor, zIndex: 3 - i }]}>
                    <Ionicons name="person" size={10} color="#FFF" />
                  </View>
                ))}
              </View>
              <Text style={styles.attendeeText}>{event.rsvp_count}+ Attending</Text>
            </View>

            {/* RSVP Button */}
            <TouchableOpacity
              onPress={handleRSVPPress}
              style={[styles.rsvpBtn, event.user_rsvped && styles.rsvpBtnActive]}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons
                  name={event.user_rsvped ? 'heart' : 'heart-outline'}
                  size={18}
                  color={event.user_rsvped ? '#FFF' : Colors.dark.accent}
                />
              </Animated.View>
              <Text style={[styles.rsvpText, event.user_rsvped && styles.rsvpTextActive]}>
                {event.user_rsvped ? 'GOING' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Feed Screen ────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [events, setEvents] = useState<any[]>([]);
  const [happeningNow, setHappeningNow] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  const loadFeed = async () => {
    setLoading(true);
    try {
      const [feed, live, recs] = await Promise.all([
        eventsApi.list().catch(() => []),
        eventsApi.happeningNow().catch(() => []),
        eventsApi.recommended().catch(() => []),
      ]);
      setEvents(feed);
      setHappeningNow(live);
      setRecommended(recs);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      const result = await eventsApi.rsvp(eventId);
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId ? { ...e, user_rsvped: result.rsvped, rsvp_count: String(result.rsvp_count) } : e
        )
      );
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('full')) {
        Alert.alert('Event Full', 'This event has reached maximum capacity.');
      } else {
        Alert.alert('Error', 'Could not RSVP. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        ListHeaderComponent={
          <>
            {/* Happening Now Banner */}
            <HappeningNowBanner events={happeningNow} onPress={(e) => router.push(`/event/${e.id}` as any)} />

            {/* AI Recommended Section */}
            {recommended.length > 0 && (
              <View style={{ marginBottom: Spacing.md }}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <Ionicons name="sparkles" size={18} color={theme.accent} />
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
                  {recommended.slice(0, 6).map((evt: any) => {
                    const catColor = Colors.categories[evt.category as keyof typeof Colors.categories] || theme.primary;
                    return (
                      <TouchableOpacity
                        key={evt.id}
                        style={{ width: 160, backgroundColor: theme.surface, borderRadius: BorderRadius.md, overflow: 'hidden' }}
                        onPress={() => router.push(`/event/${evt.id}` as any)}
                        activeOpacity={0.8}
                      >
                        <View style={{ height: 80, backgroundColor: catColor + '22', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="sparkles" size={24} color={catColor} />
                        </View>
                        <View style={{ padding: Spacing.sm }}>
                          <Text style={{ color: theme.text, fontSize: FontSize.sm, fontWeight: '600' }} numberOfLines={2}>{evt.title}</Text>
                          <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{evt.club_name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="people" size={10} color={theme.textMuted} />
                            <Text style={{ color: theme.textMuted, fontSize: 10 }}>{evt.rsvp_count} going</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section header */}
            {events.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <Text style={styles.sectionCount}>{events.length}</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onRSVP={() => handleRSVP(item.id)}
            onPress={() => router.push(`/event/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flame-outline" size={48} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>Follow clubs to see their events in your feed</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.dark.textSecondary, marginTop: Spacing.md, fontSize: FontSize.md },

  // ─── Happening Now ───────────────────────────────────────────────────────
  happeningNow: { paddingTop: 60, paddingBottom: Spacing.md },
  happeningNowHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: Spacing.xs },
  happeningNowTitle: { color: '#4ADE80', fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1.5 },
  happeningScroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  happeningCard: {
    width: 100, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.dark.border,
  },
  happeningImage: {
    width: '100%', height: 56, borderRadius: BorderRadius.sm, backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs,
  },
  happeningName: { color: Colors.dark.text, fontSize: 11, fontWeight: '600', lineHeight: 14 },
  happeningTime: { color: Colors.dark.textMuted, fontSize: 10, marginTop: 2 },

  // ─── Section ──────────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },
  sectionCount: { color: Colors.dark.textMuted, fontSize: FontSize.sm, backgroundColor: Colors.dark.surface, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },

  // ─── Event Card ───────────────────────────────────────────────────────────
  card: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: BorderRadius.lg,
    height: CARD_HEIGHT, overflow: 'hidden', backgroundColor: Colors.dark.surface,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  categoryBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10 },
  cardImageBg: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%', justifyContent: 'center', alignItems: 'center' },
  cardGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: Spacing.md },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  categoryText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  countdown: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  countdownNow: { backgroundColor: 'rgba(74,222,128,0.2)' },
  countdownText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  cardBottom: { gap: 6 },
  clubName: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  eventTitle: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: '800', lineHeight: 28 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.dark.textSecondary, fontSize: FontSize.xs },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },

  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarStack: { flexDirection: 'row' },
  avatar: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dark.background,
  },
  attendeeText: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },

  rsvpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.dark.accent,
  },
  rsvpBtnActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  rsvpText: { color: Colors.dark.accent, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1 },
  rsvpTextActive: { color: '#FFF' },

  // ─── Empty State ──────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', marginTop: SCREEN_HEIGHT * 0.25, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.dark.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xs },
});
