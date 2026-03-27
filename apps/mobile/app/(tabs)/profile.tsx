import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { users as usersApi, events as eventsApi, clubs as clubsApi, points as pointsApi, setAuthToken } from '../../services/api';

type TabKey = 'events' | 'following' | 'friends';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [followedClubs, setFollowedClubs] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [myPoints, setMyPoints] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const loadProfile = async () => {
    setLoading(true);
    try {
      const me = await usersApi.me();
      setUser(me);
      const [evts, allClubs, allFriends, pts] = await Promise.all([
        eventsApi.list().catch(() => []),
        clubsApi.list().catch(() => []),
        usersApi.friends().catch(() => []),
        pointsApi.me().catch(() => null),
      ]);
      setMyEvents(evts.filter((e: any) => e.user_rsvped));
      setFollowedClubs(allClubs.filter((c: any) => c.user_follows));
      setFriends(allFriends);
      setMyPoints(pts);
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  const handleSignIn = () => router.push('/(auth)/login' as any);

  const handleAddFriend = async () => {
    if (!friendEmail.includes('@ucr.edu')) { Alert.alert('Invalid', 'Enter a @ucr.edu email'); return; }
    try {
      await usersApi.addFriend(friendEmail);
      setFriendEmail('');
      const fr = await usersApi.friends().catch(() => []);
      setFriends(fr);
      Alert.alert('Added!', `${friendEmail} is now your friend.`);
    } catch { Alert.alert('Error', 'Could not add friend.'); }
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  // Not signed in
  if (!user) return (
    <View style={[styles.container, styles.centered]}>
      <View style={styles.signInAvatar}>
        <Ionicons name="person-outline" size={40} color={theme.textMuted} />
      </View>
      <Text style={styles.signInTitle}>Sign in to see your profile</Text>
      <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
        <Text style={styles.signInBtnText}>Sign in with @ucr.edu</Text>
      </TouchableOpacity>
    </View>
  );

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'events', label: 'My Events', count: myEvents.length },
    { key: 'following', label: 'Following', count: followedClubs.length },
    { key: 'friends', label: 'Friends', count: friends.length },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Highlander Events</Text>

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{user.display_name || 'Highlander'}</Text>
          <View style={styles.emailRow}>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>UCR</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { num: myEvents.length, label: 'Events' },
              { num: followedClubs.length, label: 'Clubs' },
              { num: friends.length, label: 'Friends' },
            ].map((stat, i) => (
              <View key={i} style={[styles.stat, i < 2 && styles.statBorder]}>
                <Text style={styles.statNum}>{stat.num}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Points & Rewards Card */}
        {myPoints && (
          <TouchableOpacity
            style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: theme.surface, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => router.push('/leaderboard' as any)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.accent + '22', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="trophy" size={22} color={theme.accent} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontSize: FontSize.md, fontWeight: '700' }}>Level {myPoints.level} · {myPoints.total_points} pts</Text>
                <Text style={{ color: theme.textSecondary, fontSize: FontSize.xs }}>Rank #{myPoints.rank} · Tap for leaderboard</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'events' && (
          myEvents.length > 0 ? myEvents.map(event => {
            const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;
            return (
              <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => router.push(`/event/${event.id}` as any)}>
                <View style={[styles.eventIcon, { backgroundColor: catColor + '22' }]}>
                  <Ionicons name="calendar" size={20} color={catColor} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {new Date(event.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {event.club_name}
                  </Text>
                </View>
                <View style={styles.attendingBadge}>
                  <Text style={styles.attendingText}>Attending</Text>
                </View>
              </TouchableOpacity>
            );
          }) : (
            <View style={styles.tabEmpty}>
              <Ionicons name="calendar-outline" size={32} color={theme.textMuted} />
              <Text style={styles.tabEmptyText}>No events yet</Text>
            </View>
          )
        )}

        {activeTab === 'following' && (
          followedClubs.length > 0 ? followedClubs.map((club: any) => (
            <TouchableOpacity key={club.id} style={styles.eventCard}>
              <View style={[styles.clubIcon, { backgroundColor: theme.accent + '22' }]}>
                <Text style={styles.clubInitial}>{club.name?.charAt(0)}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>{club.name}</Text>
                <Text style={styles.eventMeta}>{club.follower_count || 0} followers</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.tabEmpty}>
              <Ionicons name="people-outline" size={32} color={theme.textMuted} />
              <Text style={styles.tabEmptyText}>Not following any clubs yet</Text>
            </View>
          )
        )}

        {activeTab === 'friends' && (
          <>
            <View style={styles.addFriendRow}>
              <TextInput
                style={styles.friendInput}
                placeholder="friend@ucr.edu"
                placeholderTextColor={theme.textMuted}
                value={friendEmail}
                onChangeText={setFriendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddFriend}>
                <Ionicons name="person-add" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            {friends.length > 0 ? friends.map((f: any) => (
              <View key={f.id} style={styles.eventCard}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendInitial}>{f.display_name?.charAt(0) || f.email?.charAt(0)}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{f.display_name || 'Highlander'}</Text>
                  <Text style={styles.eventMeta}>{f.email}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.tabEmpty}>
                <Ionicons name="people-outline" size={32} color={theme.textMuted} />
                <Text style={styles.tabEmptyText}>Add friends with their @ucr.edu email</Text>
              </View>
            )}
          </>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await AsyncStorage.removeItem('auth_token');
                  setAuthToken(null);
                  router.replace('/(auth)/login' as any);
                },
              },
            ]);
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  // Sign in
  signInAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  signInTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '600', marginBottom: Spacing.md },
  signInBtn: { backgroundColor: Colors.dark.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  signInBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '600' },

  // Header
  profileHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.md },
  settingsBtn: { position: 'absolute', top: 60, right: Spacing.md, padding: 4 },
  headerTitle: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.md },

  avatarRing: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: Colors.dark.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: Colors.dark.accent, fontSize: FontSize.hero, fontWeight: '700' },

  displayName: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: '700' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  email: { color: Colors.dark.textSecondary, fontSize: FontSize.sm },
  verifiedBadge: { backgroundColor: Colors.dark.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  verifiedText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginTop: Spacing.md, paddingHorizontal: Spacing.xl },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.dark.border },
  statNum: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: 3 },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.dark.surfaceElevated },
  tabText: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: '500' },
  tabTextActive: { color: Colors.dark.text, fontWeight: '600' },

  // Cards
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
  },
  eventIcon: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventTitle: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600' },
  eventMeta: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  attendingBadge: { backgroundColor: Colors.dark.success + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  attendingText: { color: Colors.dark.success, fontSize: 11, fontWeight: '600' },

  clubIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  clubInitial: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: '700' },

  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  friendInitial: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600' },

  addFriendRow: { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  friendInput: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.dark.text,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  addBtn: { backgroundColor: Colors.dark.accent, width: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },

  tabEmpty: { alignItems: 'center', marginTop: 40 },
  tabEmptyText: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm },

  signOutBtn: { marginHorizontal: Spacing.md, marginTop: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center' },
  signOutText: { color: Colors.dark.textSecondary, fontSize: FontSize.md },
});
