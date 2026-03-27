import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { search as searchApi, events as eventsApi, clubs as clubsApi } from '../../services/api';

export default function SearchScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [popularClubs, setPopularClubs] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDiscovery();
    }, [])
  );

  const loadDiscovery = async () => {
    try {
      const [evts, clubs] = await Promise.all([
        eventsApi.list().catch(() => []),
        clubsApi.list().catch(() => []),
      ]);
      // Top 4 events by RSVP count as "trending"
      setTrending(evts.sort((a: any, b: any) => (b.rsvp_count || 0) - (a.rsvp_count || 0)).slice(0, 4));
      setPopularClubs(clubs.slice(0, 6));
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

  const categories = ['All', ...Object.keys(Colors.categories)];

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events and clubs..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          const catColor = cat === 'All' ? theme.accent : Colors.categories[cat as keyof typeof Colors.categories] || theme.primary;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isActive && { backgroundColor: catColor + '33', borderColor: catColor }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, { color: isActive ? catColor : theme.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {searching ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 60 }} />
      ) : hasSearched ? (
        /* Search Results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md }}
          renderItem={({ item }) => {
            const catColor = Colors.categories[item.category as keyof typeof Colors.categories] || theme.primary;
            return (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/event/${item.id}` as any)}
              >
                <View style={[styles.resultIcon, { backgroundColor: catColor + '22' }]}>
                  <Ionicons name="calendar" size={20} color={catColor} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.resultMeta}>{item.club_name} · {formatTime(item.start_time)}</Text>
                </View>
                <View style={styles.resultBadge}>
                  <Ionicons name="people" size={12} color={theme.textMuted} />
                  <Text style={styles.resultBadgeText}>{item.rsvp_count}</Text>
                </View>
              </TouchableOpacity>
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
        /* Discovery View */
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
          {/* Trending Events */}
          {trending.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 Trending</Text>
              </View>
              <View style={styles.trendingGrid}>
                {trending.slice(0, 4).map((event) => {
                  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.trendingCard}
                      onPress={() => router.push(`/event/${event.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.trendingImage, { backgroundColor: catColor + '22' }]}>
                        <Ionicons name="flame" size={24} color={catColor} />
                      </View>
                      <LinearGradient colors={['transparent', 'rgba(10,14,26,0.9)']} style={styles.trendingGradient} />
                      <View style={styles.trendingInfo}>
                        <Text style={styles.trendingTitle} numberOfLines={2}>{event.title}</Text>
                        <View style={styles.trendingMeta}>
                          <Text style={styles.trendingTime}>{formatTime(event.start_time)}</Text>
                          <View style={styles.rsvpMini}>
                            <Text style={styles.rsvpMiniText}>RSVP {event.rsvp_count}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Popular Clubs */}
          {popularClubs.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Clubs</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clubsScroll}>
                {popularClubs.map((club: any) => (
                  <TouchableOpacity
                    key={club.id}
                    style={styles.clubCard}
                    onPress={() => router.push(`/club/${club.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.clubAvatar}>
                      <Text style={styles.clubAvatarText}>{club.name?.charAt(0) || 'C'}</Text>
                    </View>
                    <Text style={styles.clubName} numberOfLines={2}>{club.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Empty discovery */}
          {trending.length === 0 && popularClubs.length === 0 && (
            <View style={styles.discoveryEmpty}>
              <Ionicons name="search" size={56} color={theme.textMuted} />
              <Text style={styles.discoveryEmptyText}>Search events and clubs at UCR</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingTop: 60 },

  searchBarWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: FontSize.md },

  categoryScroll: { maxHeight: 36, marginBottom: Spacing.md },
  categoryContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  categoryPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  categoryText: { fontSize: FontSize.xs, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },

  // Trending grid
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  trendingCard: {
    width: (Dimensions.get('window').width - Spacing.md * 2 - Spacing.sm) / 2,
    height: 180, borderRadius: BorderRadius.md, overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  trendingImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  trendingGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  trendingInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.sm },
  trendingTitle: { color: Colors.dark.text, fontSize: FontSize.sm, fontWeight: '600', lineHeight: 18 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  trendingTime: { color: Colors.dark.textSecondary, fontSize: 11 },
  rsvpMini: { backgroundColor: Colors.dark.accent + '33', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  rsvpMiniText: { color: Colors.dark.accent, fontSize: 10, fontWeight: '700' },

  // Popular clubs
  clubsScroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  clubCard: { alignItems: 'center', width: 72 },
  clubAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  clubAvatarText: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: '700' },
  clubName: { color: Colors.dark.textSecondary, fontSize: 11, textAlign: 'center', lineHeight: 14 },

  // Search results
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dark.surface, padding: Spacing.md, borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  resultIcon: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  resultInfo: { flex: 1 },
  resultTitle: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600' },
  resultMeta: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultBadgeText: { color: Colors.dark.textMuted, fontSize: FontSize.xs },

  emptySearch: { alignItems: 'center', marginTop: 60 },
  emptySearchText: { color: Colors.dark.textSecondary, marginTop: Spacing.md, fontSize: FontSize.md },

  discoveryEmpty: { alignItems: 'center', marginTop: 120 },
  discoveryEmptyText: { color: Colors.dark.textSecondary, fontSize: FontSize.md, marginTop: Spacing.md },
});
