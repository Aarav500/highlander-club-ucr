import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Alert, ScrollView, ImageBackground, Share, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
  withSequence, withRepeat, interpolate, Easing, FadeIn, FadeOut,
  SlideInRight, ZoomIn,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Gradients, Glass, Shadows, AnimTiming } from '../../constants/Colors';
import { useSpringPress, usePulse, useShimmer, useHeartBurst, useBouncingArrow, useFadeIn } from '../../constants/animations';
import { events as eventsApi } from '../../services/api';
import { BlurView } from 'expo-blur';
import { Bounceable, GlassCard } from '../../components/GlassComponents';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_HINT_KEY = '@highlander/feed_swipe_hint_shown';
const theme = Colors.dark;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ height, index }: { height: number; index: number }) {
  const { animatedStyle } = useShimmer();
  const entrance = useFadeIn({ delay: index * 100, translateY: 15 });

  return (
    <Animated.View style={[styles.skeletonCard, { height }, entrance.animatedStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[theme.surface, theme.surfaceElevated, theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Skeleton content hints */}
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonPill, animatedStyle]} />
        <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
        <Animated.View style={[styles.skeletonMeta, animatedStyle]} />
      </View>
    </Animated.View>
  );
}

// ─── Happening Now Banner ─────────────────────────────────────────────────────
function HappeningNowBanner({ events, onPress }: { events: any[]; onPress: (e: any) => void }) {
  const { animatedStyle: pulseStyle } = usePulse({ minOpacity: 0.4, maxOpacity: 1, duration: 1200 });
  const bannerFade = useFadeIn({ delay: 200, translateY: -10 });

  if (events.length === 0) return null;

  return (
    <Animated.View style={[styles.happeningNow, bannerFade.animatedStyle]}>
      <View style={styles.happeningHeader}>
        <Animated.View style={[styles.liveDot, pulseStyle]}>
          <View style={styles.liveDotInner} />
        </Animated.View>
        <Text style={styles.happeningLabel}>HAPPENING NOW</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.happeningScroll}>
        {events.map((event, i) => (
          <Animated.View key={event.id} entering={SlideInRight.delay(i * 80).springify().damping(18)}>
            <TouchableOpacity style={styles.happeningCard} onPress={() => onPress(event)} activeOpacity={0.85}>
              <LinearGradient
                colors={['rgba(0,229,255,0.12)', 'rgba(0,229,255,0.03)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.happeningIconRow}>
                <Ionicons name="radio" size={12} color={theme.cyan} />
                <Text style={styles.happeningTime}>
                  {new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.happeningName} numberOfLines={2}>{event.title}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
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
      <Ionicons name={isNow ? 'radio' : 'time-outline'} size={11} color={isNow ? theme.cyan : 'rgba(255,255,255,0.9)'} />
      <Text style={[styles.countdownText, isNow && { color: theme.cyan }]}>{isNow ? 'LIVE' : timeLeft}</Text>
    </View>
  );
}

// ─── Rail Button ──────────────────────────────────────────────────────────────
function RailButton({ icon, size = 24, color = '#FFF', onPress, badge, badgeColor }: {
  icon: string; size?: number; color?: string; onPress: () => void; badge?: string | number; badgeColor?: string;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.85 });

  return (
    <View style={styles.railItem}>
      <AnimatedTouchable
        style={[styles.railBtn, animatedStyle]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Ionicons name={icon as any} size={size} color={color} />
      </AnimatedTouchable>
      {badge !== undefined && (
        <Text style={[styles.railCount, badgeColor ? { color: badgeColor } : null]}>{badge}</Text>
      )}
    </View>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, cardHeight, friendsCount, onRSVP, onPress }: {
  event: any; cardHeight: number; friendsCount: number; onRSVP: () => void; onPress: () => void;
}) {
  const router = useRouter();
  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.985 });
  const { animatedStyle: heartStyle, burst: heartBurst } = useHeartBurst();

  const handleRSVPPress = () => {
    heartBurst();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRSVP();
  };

  const handleShare = () => {
    Share.share({
      message: `Check out "${event.title}"! 🔥\n${new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}\nhighlanderevents://event/${event.id}`,
      title: event.title,
    });
  };

  return (
    <Animated.View style={[styles.card, { height: cardHeight }]}>
      <Bounceable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
      >
        {/* Background */}
        {event.image_url ? (
          <ImageBackground source={{ uri: event.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[catColor + '55', theme.surface, theme.background]} style={StyleSheet.absoluteFill} />
        )}

        {/* Multi-stop gradient overlay */}
        <LinearGradient
          colors={['rgba(5,8,16,0.4)', 'transparent', 'transparent', 'rgba(5,8,16,0.7)']}
          locations={[0, 0.2, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Category shimmer strip at top */}
        <LinearGradient
          colors={[catColor + '80', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.catShimmer}
        />

        {/* Top: category + countdown */}
        <View style={styles.cardTop}>
          <View style={[styles.catPill, { backgroundColor: catColor + 'CC' }]}>
            {event.isRecommended && (
              <Ionicons name="sparkles" size={10} color="#FFF" style={{ marginRight: 2 }} />
            )}
            <Text style={styles.catText}>{event.category || 'Event'}</Text>
          </View>
          <CountdownTimer startTime={event.start_time} />
        </View>

        {/* Right rail — glass buttons */}
        <View style={styles.rightRail}>
          <View style={styles.railItem}>
            <Bounceable
              style={[styles.railBtn]}
              onPress={handleRSVPPress}
            >
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={event.user_rsvped ? 'heart' : 'heart-outline'}
                  size={26}
                  color={event.user_rsvped ? theme.danger : '#FFF'}
                />
              </Animated.View>
            </Bounceable>
            <Text style={styles.railCount}>{event.rsvp_count || 0}</Text>
          </View>

          <RailButton icon="arrow-redo-outline" onPress={handleShare} />
          <RailButton icon="calendar-outline" size={23} onPress={() => router.push('/(tabs)/calendar' as any)} />

          {friendsCount > 0 && (
            <RailButton
              icon="people"
              size={22}
              color={theme.success}
              onPress={onPress}
              badge={friendsCount}
              badgeColor={theme.success}
            />
          )}
        </View>

        {/* Bottom overlay — true Frosted Glass effect */}
        <View style={styles.cardBottom}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          {/* subtle border top for edge lighting */}
          <View style={{position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.15)'}} />
          
          <View style={{ padding: Spacing.lg }}>
            <TouchableOpacity onPress={() => router.push(`/club/${event.club_id}` as any)}>
              <Text style={styles.clubBadge}>{event.club_name}</Text>
            </TouchableOpacity>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.65)" />
              <Text style={styles.metaText}>
                {new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              {!!event.location && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="location-outline" size={12} color={theme.accent} />
                  <Text style={[styles.metaText, { color: theme.accent }]} numberOfLines={1}>
                    {event.location}
                  </Text>
                </>
              )}
            </View>
            {/* Attendee avatars */}
            <View style={styles.attendeeRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.miniAvatar, { marginLeft: i > 0 ? -10 : 0, backgroundColor: catColor, zIndex: 3 - i }]}>
                  <Ionicons name="person" size={8} color="#FFF" />
                </View>
              ))}
              <Text style={styles.attendeeText}>{event.rsvp_count || 0}+ attending</Text>
            </View>
          </View>
        </View>
      </Bounceable>
    </Animated.View>
  );
}

// ─── Feed Screen ──────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [happeningNow, setHappeningNow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [friendsMap, setFriendsMap] = useState<Record<string, number>>({});
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const swipeHintOpacity = useSharedValue(1);
  const arrowStyle = useBouncingArrow();

  const CARD_HEIGHT = SCREEN_HEIGHT - bannerHeight;

  useEffect(() => {
    AsyncStorage.getItem(SWIPE_HINT_KEY).then((val) => {
      if (!val) setShowSwipeHint(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => { loadFeed(); }, [])
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
      setEvents((prev) =>
        prev.map((e) =>
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

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const visible = viewableItems[0]?.item;
    if (!visible) return;
    eventsApi.friends(visible.id).then((res: any) => {
      const count = Array.isArray(res) ? res.length : (res?.count || 0);
      setFriendsMap((prev) => ({ ...prev, [visible.id]: count }));
    }).catch(() => {});
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const swipeHintStyle = useAnimatedStyle(() => ({
    opacity: swipeHintOpacity.value,
  }));

  const handleMomentumScrollEnd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showSwipeHint) {
      swipeHintOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => {
        setShowSwipeHint(false);
        AsyncStorage.setItem(SWIPE_HINT_KEY, 'true');
      }, 400);
    }
  }, [showSwipeHint]);

  if (loading || (events.length > 0 && bannerHeight === 0)) {
    return (
      <View style={styles.container}>
        <View onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}>
          <HappeningNowBanner events={happeningNow} onPress={() => {}} />
        </View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} height={SCREEN_HEIGHT / 3} index={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        decelerationRate="fast"
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
            <LinearGradient colors={[theme.primary + '22', 'transparent']} style={styles.emptyGlow} />
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Ionicons name="flame-outline" size={56} color={theme.textMuted} />
            </Animated.View>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySub}>Follow clubs to see their events in your feed</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/search' as any)}>
              <LinearGradient colors={Gradients.accent} style={styles.exploreBtnGrad}>
                <Text style={styles.exploreBtnText}>Explore Clubs</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Swipe hint */}
      {showSwipeHint && events.length > 1 && (
        <Animated.View style={[styles.swipeHint, swipeHintStyle]} pointerEvents="none">
          <Animated.View style={arrowStyle}>
            <Ionicons name="chevron-up" size={22} color="rgba(255,255,255,0.9)" />
          </Animated.View>
          <Text style={styles.swipeHintText}>Swipe up for next event</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Skeleton
  skeletonCard: { backgroundColor: theme.surface, marginBottom: 2, overflow: 'hidden' },
  skeletonContent: {
    position: 'absolute', bottom: 40, left: Spacing.md, right: 80,
  },
  skeletonPill: {
    width: 60, height: 20, borderRadius: BorderRadius.full,
    backgroundColor: theme.surfaceElevated, marginBottom: 12,
  },
  skeletonTitle: {
    width: '80%', height: 28, borderRadius: 8,
    backgroundColor: theme.surfaceElevated, marginBottom: 8,
  },
  skeletonMeta: {
    width: '50%', height: 14, borderRadius: 6,
    backgroundColor: theme.surfaceElevated,
  },

  // Happening Now
  happeningNow: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(5,8,16,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Glass.border,
  },
  happeningHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  liveDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.cyan + '30',
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.xs,
  },
  liveDotInner: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: theme.cyan,
  },
  happeningLabel: {
    fontFamily: Fonts.heading,
    color: theme.cyan, fontSize: FontSize.xs, letterSpacing: 1.5,
  },
  happeningScroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  happeningCard: {
    width: 120,
    backgroundColor: Glass.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    overflow: 'hidden',
  },
  happeningIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  happeningTime: { color: theme.cyan, fontSize: 10, fontFamily: Fonts.body },
  happeningName: { color: theme.text, fontSize: 11, fontFamily: Fonts.headingMed, lineHeight: 15 },

  // Full-screen card
  card: { overflow: 'hidden', backgroundColor: theme.surface },

  catShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },

  cardTop: {
    position: 'absolute', top: 52, left: Spacing.md, right: Spacing.md + 68,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 5, borderRadius: BorderRadius.full,
    ...Shadows.soft,
  },
  catText: {
    fontFamily: Fonts.heading,
    color: '#FFF', fontSize: 10, letterSpacing: 0.5,
  },
  countdown: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Glass.background,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Glass.border,
  },
  countdownNow: { backgroundColor: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.3)' },
  countdownText: { fontFamily: Fonts.heading, color: '#FFF', fontSize: 10 },

  // Right rail — glass buttons
  rightRail: {
    position: 'absolute', right: Spacing.md, bottom: 140,
    alignItems: 'center', gap: Spacing.md, zIndex: 10,
  },
  railItem: { alignItems: 'center', gap: 4 },
  railBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Glass.background,
    borderWidth: 1, borderColor: Glass.border,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.soft,
  },
  railCount: {
    fontFamily: Fonts.heading,
    color: '#FFF', fontSize: 12,
  },

  // Card bottom (Frosted glass)
  cardBottom: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    zIndex: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 85, // clear bottom tabs
  },
  clubBadge: {
    fontFamily: Fonts.headingMed,
    color: 'rgba(255,255,255,0.7)', fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: 2,
  },
  eventTitle: {
    fontFamily: Fonts.heading,
    color: '#FFFFFF', fontSize: FontSize.xxl, lineHeight: 34,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'nowrap' },
  metaText: {
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.7)', fontSize: 12,
  },
  metaDot: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  miniAvatar: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(5,8,16,0.5)',
  },
  attendeeText: {
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.65)', fontSize: 11, marginLeft: Spacing.sm,
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute', bottom: 110, alignSelf: 'center',
    alignItems: 'center', gap: 4, zIndex: 20,
  },
  swipeHintText: {
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.8)', fontSize: 12,
  },

  // Empty state
  emptyState: {
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl,
  },
  emptyGlow: {
    position: 'absolute', top: 0, left: SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.6, height: 300, borderRadius: 150,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    color: theme.text, fontSize: FontSize.xl, marginTop: Spacing.md,
  },
  emptySub: {
    fontFamily: Fonts.body,
    color: theme.textSecondary, fontSize: FontSize.sm,
    textAlign: 'center', marginTop: Spacing.xs,
  },
  exploreBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow('#FFB800'),
  },
  exploreBtnGrad: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  exploreBtnText: {
    fontFamily: Fonts.headingMed,
    color: '#000', fontSize: FontSize.md,
  },
});
