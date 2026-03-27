import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors';
import { points as pointsApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LEVEL_TITLES = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Scholar', 'Legend', 'Icon', 'MVP', 'Champion', 'Highlander'];

export default function LeaderboardScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [myPoints, setMyPoints] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    try {
      const [me, board] = await Promise.all([
        pointsApi.me().catch(() => null),
        pointsApi.leaderboard().catch(() => []),
      ]);
      setMyPoints(me);
      setLeaderboard(board);
    } catch (err) {
      console.error('Leaderboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelTitle = (level: number) => LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || 'Highlander';
  const getRankEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Ionicons name="trophy" size={24} color={theme.accent} />
      </View>

      {/* My Stats Card */}
      {myPoints && (
        <LinearGradient
          colors={[theme.primary, '#1a3a6a']}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsTop}>
            <View style={styles.statsLevel}>
              <Text style={styles.statsLevelNum}>LVL {myPoints.level}</Text>
              <Text style={styles.statsLevelTitle}>{getLevelTitle(myPoints.level)}</Text>
            </View>
            <View style={styles.statsPoints}>
              <Text style={styles.statsPointsNum}>{myPoints.total_points}</Text>
              <Text style={styles.statsPointsLabel}>POINTS</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${myPoints.level_progress}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {myPoints.level_progress} / 100 XP to Level {myPoints.level + 1}
          </Text>

          <View style={styles.statsBottom}>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statValue}>Rank #{myPoints.rank}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Points Guide */}
      <View style={styles.guideRow}>
        <View style={styles.guideItem}>
          <Text style={styles.guidePoints}>+20</Text>
          <Text style={styles.guideLabel}>Check In</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guidePoints}>+10</Text>
          <Text style={styles.guideLabel}>Photo</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guidePoints}>+5</Text>
          <Text style={styles.guideLabel}>RSVP</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guidePoints}>+50</Text>
          <Text style={styles.guideLabel}>1st Event</Text>
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[
            styles.leaderRow,
            item.rank <= 3 && styles.leaderRowTop3,
          ]}>
            <Text style={[styles.leaderRank, item.rank <= 3 && styles.leaderRankTop3]}>
              {getRankEmoji(item.rank)}
            </Text>
            <View style={[styles.leaderAvatar, { backgroundColor: item.rank <= 3 ? theme.accent : theme.primary }]}>
              <Text style={styles.leaderAvatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.leaderMeta}>
                Level {item.level} · {item.events_attended} events
              </Text>
            </View>
            <View style={styles.leaderPoints}>
              <Text style={styles.leaderPointsNum}>{item.total_points}</Text>
              <Text style={styles.leaderPointsLabel}>pts</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptySub}>Check in at events to earn points!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: '800' },

  statsCard: { margin: Spacing.md, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  statsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLevel: {},
  statsLevelNum: { color: '#FFF', fontSize: FontSize.xs, fontWeight: '700', opacity: 0.7 },
  statsLevelTitle: { color: '#FFF', fontSize: FontSize.xl, fontWeight: '800' },
  statsPoints: { alignItems: 'flex-end' },
  statsPointsNum: { color: Colors.dark.accent, fontSize: 36, fontWeight: '900' },
  statsPointsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  xpBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: Spacing.md, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: Colors.dark.accent, borderRadius: 4 },
  xpText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: Spacing.xs },
  statsBottom: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.lg },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statValue: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '600' },

  guideRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm,
  },
  guideItem: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
  },
  guidePoints: { color: Colors.dark.accent, fontSize: FontSize.md, fontWeight: '800' },
  guideLabel: { color: Colors.dark.textSecondary, fontSize: 10, marginTop: 2 },

  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md, marginBottom: Spacing.xs,
  },
  leaderRowTop3: { borderWidth: 1, borderColor: Colors.dark.accent + '44' },
  leaderRank: { width: 32, color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  leaderRankTop3: { fontSize: FontSize.lg },
  leaderAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  leaderAvatarText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
  leaderInfo: { flex: 1 },
  leaderName: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600' },
  leaderMeta: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  leaderPoints: { alignItems: 'flex-end' },
  leaderPointsNum: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: '800' },
  leaderPointsLabel: { color: Colors.dark.textMuted, fontSize: 10 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },
});
