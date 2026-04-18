import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, Gradients } from '../../constants/Colors';
import { useSpringPress, useGlowPulse } from '../../constants/animations';
import { clubs as clubsApi } from '../../services/api';

const theme = Colors.dark;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const glowStyle = useGlowPulse({ minScale: 0.92, maxScale: 1.08, duration: 3000 });
  const { animatedStyle: followPress, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.95 });

  useEffect(() => { loadClub(); }, [id]);

  const loadClub = async () => {
    try { setClub(await clubsApi.get(id as string)); }
    catch { console.error('Club load error'); }
    finally { setLoading(false); }
  };

  const handleFollow = async () => {
    try {
      const result = await clubsApi.follow(id as string);
      setClub((prev: any) => ({ ...prev, user_follows: result.following, follower_count: String(result.follower_count) }));
    } catch {}
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!club) return null;

  const catColor = Colors.categories[club.category as keyof typeof Colors.categories] || theme.primary;

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <View style={styles.header}>
        <LinearGradient colors={[catColor + '33', catColor + '11', 'transparent']} style={StyleSheet.absoluteFill} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={styles.glassBtnBg}><Ionicons name="chevron-back" size={24} color="#FFF" /></View>
        </TouchableOpacity>

        {/* Logo with glow ring */}
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.logoGlow, { backgroundColor: catColor + '20' }, glowStyle]} />
          {club.logo_url ? (
            <Image source={{ uri: club.logo_url }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: catColor }]}>
              <Ionicons name="people" size={32} color="#FFF" />
            </View>
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.clubName}>{club.name}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={[styles.categoryPill, { backgroundColor: catColor + '25', borderColor: catColor + '55' }]}>
            <View style={[styles.catDot, { backgroundColor: catColor }]} />
            <Text style={[styles.categoryText, { color: catColor }]}>{club.category}</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{club.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{club.upcoming_events?.length || 0}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actionsRow}>
          <AnimatedTouchable
            style={[styles.actionBtn, { backgroundColor: club.user_follows ? theme.surfaceElevated : theme.primary }, followPress]}
            onPress={handleFollow}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <Ionicons name={club.user_follows ? 'checkmark' : 'add'} size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>{club.user_follows ? 'Following' : 'Follow'}</Text>
          </AnimatedTouchable>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.push(`/club-chat/${club.id}` as any)}>
            <Ionicons name="chatbubbles" size={18} color="#000" />
            <Text style={[styles.actionBtnText, { color: '#000' }]}>Chat</Text>
          </TouchableOpacity>

          {club.is_admin && (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border }]}
                onPress={() => router.push(`/admin-panel/${club.id}` as any)}>
                <Ionicons name="shield-checkmark" size={16} color={theme.primaryLight} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border }]}
                onPress={() => router.push(`/club-dashboard/${club.id}` as any)}>
                <Ionicons name="bar-chart" size={16} color={theme.accent} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>

      {/* Description */}
      {club.description && (
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
          <Text style={styles.description}>{club.description}</Text>
        </Animated.View>
      )}

      {/* Upcoming Events */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
      </Animated.View>

      <FlatList
        data={club.upcoming_events || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(450 + index * 50).springify()}>
            <TouchableOpacity style={styles.eventCard} onPress={() => router.push(`/event/${item.id}` as any)} activeOpacity={0.8}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{formatDate(item.start_time)} · {item.rsvp_count} going</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, overflow: 'hidden' },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 36, left: 16, zIndex: 10 },
  glassBtnBg: { width: 42, height: 42, borderRadius: 21, backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border, justifyContent: 'center', alignItems: 'center' },

  logoWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logoGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55 },
  logo: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: Glass.border },
  logoPlaceholder: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },

  clubName: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl, textAlign: 'center', marginBottom: Spacing.xs },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: FontSize.xs, fontFamily: Fonts.heading, textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.xl },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl },
  statLabel: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Glass.border },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, ...Shadows.soft,
  },
  actionBtnText: { color: '#FFF', fontSize: FontSize.md, fontFamily: Fonts.headingMed },

  section: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Fonts.heading, color: theme.text },
  description: { fontSize: FontSize.md, lineHeight: 22, color: theme.textSecondary, fontFamily: Fonts.body },

  eventCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
    backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border,
    ...Shadows.soft,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontFamily: Fonts.headingMed, color: theme.text, marginBottom: 4 },
  eventMeta: { fontSize: FontSize.sm, color: theme.textSecondary, fontFamily: Fonts.body },

  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: FontSize.md, color: theme.textMuted, fontFamily: Fonts.body, marginTop: Spacing.sm },
});
