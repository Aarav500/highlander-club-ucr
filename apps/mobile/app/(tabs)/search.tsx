import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInDown, FadeInRight, ZoomIn,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, AnimTiming } from '../../constants/Colors';
import { useSpringPress, useFadeIn } from '../../constants/animations';
import { search as searchApi, events as eventsApi, clubs as clubsApi } from '../../services/api';

const theme = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Trending Card ────────────────────────────────────────────────────────────
function TrendingCard({ event, index }: { event: any; index: number }) {
  const router = useRouter();
  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.95 });

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(16)}>
      <AnimatedTouchable
        style={[styles.trendingCard, { width: CARD_W }, pressStyle]}
        onPress={() => router.push(`/event/${event.id}` as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient colors={[catColor + '44', catColor + '11']} style={StyleSheet.absoluteFill} />
        <View style={[styles.trendingCatDot, { backgroundColor: catColor, ...Shadows.glowSmall(catColor) }]} />
        <LinearGradient colors={['transparent', 'rgba(5,8,16,0.95)']} style={styles.trendingOverlay} />
        <View style={styles.trendingInfo}>
          <Text style={styles.trendingTitle} numberOfLines={2}>{event.title}</Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingTime}>
              {new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <View style={styles.rsvpPill}>
              <Text style={styles.rsvpPillText}>♥ {event.rsvp_count || 0}</Text>
            </View>
          </View>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

// ─── Club Card ────────────────────────────────────────────────────────────────
function ClubAvatar({ club, index }: { club: any; index: number }) {
  const router = useRouter();
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.9 });

  return (
    <Animated.View entering={ZoomIn.delay(200 + index * 60).springify().damping(14)}>
      <AnimatedTouchable
        style={[styles.clubCard, pressStyle]}
        onPress={() => router.push(`/club/${club.id}` as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.clubAvatarRing}>
          <View style={styles.clubAvatar}>
            <Text style={styles.clubAvatarText}>{club.name?.charAt(0) || 'C'}</Text>
          </View>
        </View>
        <Text style={styles.clubName} numberOfLines={2}>{club.name}</Text>
        <Text style={styles.clubFollowers}>{club.follower_count || 0} followers</Text>
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [popularClubs, setPopularClubs] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Search bar animated border
  const borderProgress = useSharedValue(0);
  const searchBarStyle = useAnimatedStyle(() => ({
    borderColor: borderProgress.value > 0.5 ? theme.primary : theme.border,
    borderWidth: 1.5,
  }));

  const headerFade = useFadeIn({ delay: 0, translateY: -15 });

  useFocusEffect(useCallback(() => { loadDiscovery(); }, []));

  const loadDiscovery = async () => {
    try {
      const [evts, clubs] = await Promise.all([
        eventsApi.list().catch(() => []),
        clubsApi.list().catch(() => []),
      ]);
      setTrending(evts.sort((a: any, b: any) => (b.rsvp_count || 0) - (a.rsvp_count || 0)).slice(0, 4));
      setPopularClubs(clubs.slice(0, 8));
    } catch (err) {
      console.error('Discovery load error:', err);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setHasSearched(false); return; }
    setSearching(true);
    setHasSearched(true);
    try {
      const result = await searchApi.query(text, activeCategory !== 'All' ? activeCategory : undefined);
      setResults(result.events || result || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const handleFocus = () => { borderProgress.value = withSpring(1, AnimTiming.springSnappy); };
  const handleBlur = () => { borderProgress.value = withSpring(0, AnimTiming.springSnappy); };

  const categories = ['All', ...Object.keys(Colors.categories)];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerFade.animatedStyle]}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>Discover events and clubs at UCR</Text>
      </Animated.View>

      {/* Search Bar — glass morphism */}
      <View style={styles.searchWrap}>
        <Animated.View style={[styles.searchBar, searchBarStyle]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search events and clubs..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pillContent}>
        {categories.map((cat, i) => {
          const isActive = activeCategory === cat;
          const catColor = cat === 'All' ? theme.accent : (Colors.categories[cat as keyof typeof Colors.categories] || theme.primary);
          return (
            <Animated.View key={cat} entering={FadeInRight.delay(i * 40).springify()}>
              <TouchableOpacity
                style={[styles.pill, isActive && { backgroundColor: catColor + '20', borderColor: catColor }]}
                onPress={() => setActiveCategory(cat)}
              >
                {isActive && <View style={[styles.pillDot, { backgroundColor: catColor }]} />}
                <Text style={[styles.pillText, { color: isActive ? catColor : theme.textMuted }]}>{cat}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Content */}
      {searching ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 60 }} />
      ) : hasSearched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const catColor = Colors.categories[item.category as keyof typeof Colors.categories] || theme.primary;
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/event/${item.id}` as any)} activeOpacity={0.8}>
                  <View style={[styles.resultIcon, { backgroundColor: catColor + '22' }]}>
                    <Ionicons name="calendar" size={20} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.resultMeta}>{item.club_name} · {new Date(item.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                  </View>
                  <View style={styles.rsvpBadge}>
                    <Ionicons name="heart" size={11} color={theme.danger} />
                    <Text style={styles.rsvpBadgeText}>{item.rsvp_count || 0}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptySearchText}>No results for "{query}"</Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Trending */}
          {trending.length > 0 && (
            <>
              <Animated.View style={styles.sectionHeader} entering={FadeInDown.delay(100)}>
                <View style={[styles.sectionIcon, { backgroundColor: theme.accent + '22' }]}>
                  <Ionicons name="flame" size={14} color={theme.accent} />
                </View>
                <Text style={styles.sectionTitle}>Trending Now</Text>
              </Animated.View>
              <View style={styles.trendingGrid}>
                {trending.map((event, i) => (
                  <TrendingCard key={event.id} event={event} index={i} />
                ))}
              </View>
            </>
          )}

          {/* Popular Clubs */}
          {popularClubs.length > 0 && (
            <>
              <Animated.View style={styles.sectionHeader} entering={FadeInDown.delay(300)}>
                <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '22' }]}>
                  <Ionicons name="star" size={14} color={theme.primaryLight} />
                </View>
                <Text style={styles.sectionTitle}>Popular Clubs</Text>
              </Animated.View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clubsScroll}>
                {popularClubs.map((club: any, i) => (
                  <ClubAvatar key={club.id} club={club} index={i} />
                ))}
              </ScrollView>
            </>
          )}

          {trending.length === 0 && popularClubs.length === 0 && (
            <View style={styles.emptySearch}>
              <Ionicons name="compass-outline" size={56} color={theme.textMuted} />
              <Text style={styles.emptySearchText}>Search events and clubs at UCR</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xxl },
  headerSub: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  searchWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Glass.background, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderWidth: 1.5, borderColor: theme.border,
  },
  searchInput: { flex: 1, fontFamily: Fonts.body, color: theme.text, fontSize: FontSize.md },

  pillScroll: { maxHeight: 40, marginBottom: Spacing.md },
  pillContent: { paddingHorizontal: Spacing.md, gap: Spacing.xs, alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: theme.border,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontFamily: Fonts.headingMed, fontSize: FontSize.xs },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.lg },

  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  trendingCard: {
    height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: Glass.border,
    ...Shadows.card,
  },
  trendingCatDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  trendingInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.sm },
  trendingTitle: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.sm, lineHeight: 18, marginBottom: 6 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendingTime: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: 10 },
  rsvpPill: { backgroundColor: theme.danger + '25', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  rsvpPillText: { fontFamily: Fonts.heading, color: theme.danger, fontSize: 10 },

  clubsScroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  clubCard: { alignItems: 'center', width: 80 },
  clubAvatarRing: {
    width: 66, height: 66, borderRadius: 33,
    borderWidth: 2, borderColor: theme.accent + '44',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  clubAvatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  clubAvatarText: { fontFamily: Fonts.heading, color: theme.accent, fontSize: FontSize.lg },
  clubName: { fontFamily: Fonts.headingMed, color: theme.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 13 },
  clubFollowers: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },

  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Glass.background, padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Glass.border,
  },
  resultIcon: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.md },
  resultMeta: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  rsvpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rsvpBadgeText: { fontFamily: Fonts.heading, color: theme.textMuted, fontSize: FontSize.xs },

  emptySearch: { alignItems: 'center', marginTop: 60, paddingHorizontal: Spacing.xl },
  emptySearchText: { fontFamily: Fonts.headingMed, color: theme.textSecondary, fontSize: FontSize.md, marginTop: Spacing.md, textAlign: 'center' },
});
