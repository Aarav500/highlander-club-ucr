import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { clubs as clubsApi } from '../../services/api';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadClub(); }, [id]);

  const loadClub = async () => {
    try {
      const data = await clubsApi.get(id as string);
      setClub(data);
    } catch (err) {
      console.error('Club load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const result = await clubsApi.follow(id as string);
      setClub((prev: any) => ({
        ...prev,
        user_follows: result.following,
        follower_count: String(result.follower_count),
      }));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!club) return null;

  const catColor = Colors.categories[club.category as keyof typeof Colors.categories] || theme.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: catColor + '22' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        {club.logo_url ? (
          <Image source={{ uri: club.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: catColor }]}>
            <Ionicons name="people" size={32} color="#FFF" />
          </View>
        )}

        <Text style={[styles.clubName, { color: theme.text }]}>{club.name}</Text>
        <View style={[styles.categoryPill, { backgroundColor: catColor + '33' }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>{club.category}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: theme.accent }]}>{club.follower_count}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: theme.accent }]}>{club.upcoming_events?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Events</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: club.user_follows ? theme.surfaceElevated : theme.primary, marginTop: 0 }]}
            onPress={handleFollow}
          >
            <Ionicons name={club.user_follows ? 'checkmark' : 'add'} size={18} color="#FFF" />
            <Text style={styles.followBtnText}>{club.user_follows ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: theme.accent, marginTop: 0 }]}
            onPress={() => router.push(`/club-chat/${club.id}` as any)}
          >
            <Ionicons name="chatbubbles" size={18} color="#FFF" />
            <Text style={styles.followBtnText}>Chat</Text>
          </TouchableOpacity>
          {club.is_admin && (
            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: theme.surfaceElevated, marginTop: 0 }]}
              onPress={() => router.push(`/club-dashboard/${club.id}` as any)}
            >
              <Ionicons name="bar-chart" size={18} color={theme.accent} />
              <Text style={[styles.followBtnText, { color: theme.accent }]}>Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      {club.description && (
        <View style={styles.section}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{club.description}</Text>
        </View>
      )}

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Events</Text>
      </View>

      <FlatList
        data={club.upcoming_events || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.eventCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push(`/event/${item.id}` as any)}
          >
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
                {formatDate(item.start_time)} · {item.rsvp_count} going
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No upcoming events</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  backBtn: { position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: 36 },
  logoPlaceholder: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  clubName: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  categoryPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.xs },
  categoryText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  stat: { alignItems: 'center' },
  statNum: { fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  followBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  description: { fontSize: FontSize.md, lineHeight: 22 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  eventMeta: { fontSize: FontSize.sm },
  emptyText: { fontSize: FontSize.md, textAlign: 'center', padding: Spacing.xl },
});
