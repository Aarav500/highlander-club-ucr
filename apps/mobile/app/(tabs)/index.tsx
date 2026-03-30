import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Alert, Animated,
  ScrollView, ImageBackground, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { events as eventsApi } from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_HINT_KEY = '@highlander/feed_swipe_hint_shown';

// ─── Skeleton Card ───────────────────────────────────────────────────────────
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

// ─── Happening Now Banner ────────────────────────────────────────────────────
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
            <Text style={styles.happeningTime}>
              {new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
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

// ─── Full-Screen Event Card (TikTok style) ───────────────────────────────────
function EventCard({
  event,
  cardHeight,
  friendsCount,
  onRSVP,
  onPress,
}: {
  event: any;
  cardHeight: number;
  friendsCount: number;
  onRSVP: () => void;
  onPress: () => void;
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

  const handleShare = () => {
    Share.share({
      message: `Check out "${event.title}"! 🎉\n${new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}\nunipulse://event/${event.id}`,
      title: event.title,
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { height: cardHeight }]}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* Background: real image or category-colored placeholder */}
      {event.image_url ? (
        <ImageBackground
          source={{ uri: event.image_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cardPlaceholder, { backgroundColor: catColor + '33' }]}>
          <Ionicons name="calendar" size={80} color={catColor + '55'} />
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'transparent', 'transparent', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.2, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top strip: category pill + countdown */}
      <View style={styles.cardTop}>
        <View style={[styles.categoryPill, { backgroundColor: catColor + 'CC' }]}>
          {event.isRecommended && (
            <Ionicons name="sparkles" size={10} color="#FFF" style={{ marginRight: 3 }} />
          )}
          <Text style={styles.categoryText}>{event.category || 'Event'}</Text>
        </View>
        <CountdownTimer startTime={event.start_time} />
      </View>

      {/* Right rail: actions */}
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
          <TouchableOpacity
            style={styles.railBtn}
            onPress={() => router.push('/(tabs)/calendar' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Share */}
        <View style={styles.railItem}>
          <TouchableOpacity style={styles.railBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Friends going (only when > 0) */}
        {friendsCount > 0 && (
          <View style={styles.railItem}>
            <TouchableOpacity style={styles.railBtn} onPress={onPress} activeOpacity={0.8}>
              <Ionicons name="people" size={24} color="#4ADE80" />
            </TouchableOpacity>
            <Text style={[styles.railCount, { color: '#4ADE80' }]}>{friendsCount}</Text>
          </View>
        )}
      </View>

      {/* Bottom overlay: club, title, meta, attendees */}
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
          {!!event.location && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="location-outline" size={13} color={Colors.dark.accent} />
              <Text style={[styles.metaText, { color: Colors.dark.accent }]} numberOfLines={1}>
                {event.location}
              </Text>
            </>
          )}
        </View>
        <View style={styles.attendeeRow}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[styles.avatar, { marginLeft: i * -8, backgroundColor: catColor, zIndex: 3 - i }]}
            >
              <Ionicons name="person" size={9} color="#FFF" />
            </View>
          ))}
          <Text style={styles.attendeeText}>{event.rsvp_count}+ attending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Feed Screen ─────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const router = useRouter();
  const theme = Colors.dark;

  const [events, setEvents] = useState<any[]>([]);
  const [happeningNow, setHappeningNow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [friendsMap, setFriendsMap] = useState<Record<string, number>>({});
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const swipeHintAnim = useRef(new Animated.Value(1)).current;

  const CARD_HEIGHT = SCREEN_HEIGHT - bannerHeight;

  // Show swipe hint on first launch
  useEffect(() => {
    AsyncStorage.getItem(SWIPE_HINT_KEY).then(val => {
      if (!val) setShowSwipeHint(true);
    });
  }, []);

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
      setHappeningNow(live);

      // Inject recommended events inline every 5 chronological events
      const recIds = new Set((recs as any[]).map((r: any) => r.id));
      const recQueue = (recs as any[]).map((r: any) => ({ ...r, isRecommended: true }));
      const combined: any[] = [];
      let recIdx = 0;
      (feed as any[]).forEach((evt: any) => {
        if (!recIds.has(evt.id)) combined.push(evt);
        if (combined.length % 5 === 4 && recIdx < recQueue.length) {
          combined.push(recQueue[recIdx++]);
        }
      });
      while (recIdx < recQueue.length) combined.push(recQueue[recIdx++]);

      setEvents(combined);
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
          e.id === eventId
            ? { ...e, user_rsvped: result.rsvped, rsvp_count: String(result.rsvp_count) }
            : e
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

  // Lazy-fetch friends count for currently visible card
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const visible = viewableItems[0]?.item;
    if (!visible) return;
    eventsApi.friends(visible.id).then((list: any[]) => {
      setFriendsMap(prev => ({ ...prev, [visible.id]: list.length }));
    }).catch(() => {});
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const handleMomentumScrollEnd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showSwipeHint) {
      Animated.timing(swipeHintAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowSwipeHint(false);
        AsyncStorage.setItem(SWIPE_HINT_KEY, 'true');
      });
    }
  }, [showSwipeHint]);

  // Show skeletons while loading OR before banner height is measured
  if (loading || (events.length > 0 && bannerHeight === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Invisible banner to measure height */}
        <View onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}>
          <HappeningNowBanner events={happeningNow} onPress={() => {}} />
        </View>
        {[0, 1, 2].map(i => (
          <SkeletonCard key={i} height={SCREEN_HEIGHT / 3} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Happening Now banner — OUTSIDE FlatList (Android pagingEnabled fix) */}
      <View onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}>
        <HappeningNowBanner
          events={happeningNow}
          onPress={(e) => router.push(`/event/${e.id}` as any)}
        />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            cardHeight={CARD_HEIGHT}
            friendsCount={friendsMap[item.id] || 0}
            onRSVP={() => handleRSVP(item.id)}
            onPress={() => router.push(`/event/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, { height: CARD_HEIGHT }]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flame-outline" size={48} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>Follow clubs to see their events in your feed</Text>
          </View>
        }
      />

      {/* Swipe hint */}
      {showSwipeHint && events.length > 1 && (
        <Animated.View style={[styles.swipeHint, { opacity: swipeHintAnim }]} pointerEvents="none">
          <Ionicons name="chevron-up" size={24} color="rgba(255,255,255,0.8)" />
          <Text style={styles.swipeHintText}>Swipe up for next event</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },

  // ─── Skeleton ───────────────────────────────────────────────────────────
  skeletonCard: { backgroundColor: Colors.dark.surface, marginBottom: 2 },

  // ─── Happening Now ───────────────────────────────────────────────────────
  happeningNow: { paddingTop: 56, paddingBottom: Spacing.sm },
  happeningNowHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: Spacing.xs },
  happeningNowTitle: { color: '#4ADE80', fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1.5 },
  happeningScroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  happeningCard: {
    width: 100, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.dark.border,
  },
  happeningImage: {
    width: '100%', height: 56, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs,
  },
  happeningName: { color: Colors.dark.text, fontSize: 11, fontWeight: '600', lineHeight: 14 },
  happeningTime: { color: Colors.dark.textMuted, fontSize: 10, marginTop: 2 },

  // ─── Full-screen card ─────────────────────────────────────────────────────
  card: { overflow: 'hidden', backgroundColor: Colors.dark.surface },
  cardPlaceholder: { justifyContent: 'center', alignItems: 'center' },

  cardTop: {
    position: 'absolute', top: 52, left: Spacing.md, right: Spacing.md + 64,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    zIndex: 10,
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  categoryText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  countdown: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  countdownNow: { backgroundColor: 'rgba(74,222,128,0.25)' },
  countdownText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Right rail
  rightRail: {
    position: 'absolute', right: Spacing.md, bottom: 120,
    alignItems: 'center', gap: Spacing.md, zIndex: 10,
  },
  railItem: { alignItems: 'center', gap: 3 },
  railBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'center', alignItems: 'center',
  },
  railCount: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Bottom overlay
  cardBottom: {
    position: 'absolute', left: Spacing.md, right: 72, bottom: Spacing.xl,
    zIndex: 10, gap: 5,
  },
  clubName: {
    color: 'rgba(255,255,255,0.75)', fontSize: 11,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
  },
  eventTitle: { color: '#FFFFFF', fontSize: FontSize.xxl, fontWeight: '900', lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  metaDot: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  avatar: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)',
  },
  attendeeText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginLeft: Spacing.sm },

  // Swipe hint
  swipeHint: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    alignItems: 'center', gap: 4, zIndex: 20,
  },
  swipeHintText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  // Empty state
  emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtitle: {
    color: Colors.dark.textSecondary, fontSize: FontSize.md,
    textAlign: 'center', marginTop: Spacing.xs,
  },
});
