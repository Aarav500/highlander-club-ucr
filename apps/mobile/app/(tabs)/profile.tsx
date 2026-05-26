import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, Gradients } from '../../constants/Colors';
import { useFadeIn, useSpringPress } from '../../constants/animations';
import { users as usersApi, storageApi } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { AmbientBackground, Bounceable, GlassCard } from '../../components/GlassComponents';

const theme = Colors.dark;
type TabKey = 'events' | 'following' | 'clubs' | 'friends';
const OFFICER_ROLES = new Set(['officer', 'vice_president', 'president']);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [followedClubs, setFollowedClubs] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  const headerFade = useFadeIn({ delay: 0, translateY: -15 });

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const loadProfile = async () => {
    setLoading(true);
    try {
      const me = await usersApi.me();
      setUser(me);
      const [rsvpRes, followRes, memberRes] = await Promise.all([
        supabase.from('rsvps').select('event_id, events(*, clubs(name,logo_url))').eq('user_id', me.id),
        supabase.from('follows').select('club_id, clubs(*)').eq('user_id', me.id),
        supabase.from('club_members').select('role, clubs(*)').eq('user_id', me.id),
      ]);
      setMyEvents((rsvpRes.data || []).map((r: any) => r.events).filter(Boolean));
      setFollowedClubs((followRes.data || []).map((r: any) => r.clubs).filter(Boolean));
      setMyClubs((memberRes.data || []).map((r: any) => ({ ...r.clubs, user_role: r.role })).filter(Boolean));
      setFriends([]);
    } catch (e) { console.error('Profile load error:', e); setUser(null); }
    finally { setLoading(false); }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const publicUrl = await storageApi.uploadPhoto(asset.uri, 'avatars');
      await usersApi.update(user.id, { avatar_url: publicUrl });
      setUser((u: any) => ({ ...u, avatar_url: publicUrl }));
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Try a smaller image.');
    } finally { setUploadingAvatar(false); }
  };

  const handleHighlanderLink = async () => {
    await WebBrowser.openBrowserAsync('https://highlanderlink.ucr.edu', {
      toolbarColor: theme.surface, controlsColor: theme.accent,
    });
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  if (!user) return (
    <View style={[styles.container, styles.centered]}>
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <View style={styles.signInIcon}>
          <Ionicons name="person-outline" size={36} color={theme.textMuted} />
        </View>
      </Animated.View>
      <Text style={styles.signInTitle}>Sign in to see your profile</Text>
      <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login' as any)}>
        <LinearGradient colors={Gradients.primary} style={styles.signInBtnGrad}>
          <Text style={styles.signInBtnText}>Sign in with UCR</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const tabs: { key: TabKey; label: string; count: number; icon: string }[] = [
    { key: 'events', label: 'Events', count: myEvents.length, icon: 'calendar' },
    { key: 'following', label: 'Following', count: followedClubs.length, icon: 'heart' },
    { key: 'clubs', label: 'My Clubs', count: myClubs.length, icon: 'shield' },
    { key: 'friends', label: 'Friends', count: friends.length, icon: 'people' },
  ];

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Animated header gradient */}
        <LinearGradient colors={[theme.primary + '30', theme.cyan + '10', 'transparent']}
          locations={[0, 0.4, 1]} style={styles.headerGrad} />

        {/* Profile header */}
        <Animated.View style={[styles.profileHeader, headerFade.animatedStyle]}>
          {/* Avatar with glow ring */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <View style={styles.avatarGlowRing}>
              {uploadingAvatar ? (
                <View style={styles.avatar}><ActivityIndicator color={theme.accent} /></View>
              ) : user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</Text>
                </View>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={11} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{user.name || 'Highlander'}</Text>
          <View style={styles.emailRow}>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.ucrBadge}>
              <LinearGradient colors={Gradients.primary} style={styles.ucrBadgeGrad}>
                <Text style={styles.ucrBadgeText}>UCR</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Stats with glass card */}
          <View style={styles.statsCard}>
            {[
              { num: myEvents.length, label: 'Events' },
              { num: followedClubs.length, label: 'Clubs' },
              { num: friends.length, label: 'Friends' },
            ].map((s, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(200 + i * 80).springify()} style={[styles.stat, i < 2 && styles.statDivider]}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabScroll}>
          {tabs.map((tab, i) => (
            <Animated.View key={tab.key} entering={FadeInDown.delay(400 + i * 50).springify()}>
              <TouchableOpacity
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? theme.accent : theme.textMuted} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}{tab.count > 0 ? ` (${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Tab: Events */}
        {activeTab === 'events' && (
          myEvents.length > 0 ? myEvents.map((event, idx) => {
            const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;
            return (
              <Animated.View key={event.id} entering={FadeInDown.delay(idx * 50).springify()}>
                <Bounceable onPress={() => router.push(`/event/${event.id}` as any)}>
                  <GlassCard style={styles.card} intensity={50}>
                    <View style={[styles.cardIcon, { backgroundColor: catColor + '22' }]}>
                      <Ionicons name="calendar" size={20} color={catColor} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.cardMeta}>{new Date(event.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {event.club_name}</Text>
                    </View>
                    <View style={styles.attendingBadge}>
                      <Text style={styles.attendingText}>Going</Text>
                    </View>
                  </GlassCard>
                </Bounceable>
              </Animated.View>
            );
          }) : (
            <View style={styles.emptyTab}>
              <Ionicons name="calendar-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTabText}>RSVP to events to see them here</Text>
            </View>
          )
        )}

        {/* Tab: Following */}
        {activeTab === 'following' && (
          followedClubs.length > 0 ? followedClubs.map((club: any, idx) => (
            <Animated.View key={club.id} entering={FadeInDown.delay(idx * 50).springify()}>
              <Bounceable onPress={() => router.push(`/club/${club.id}` as any)}>
                <GlassCard style={styles.card} intensity={50}>
                  <View style={[styles.clubIcon, { backgroundColor: theme.accent + '22' }]}>
                    {club.logo_url
                      ? <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
                      : <Text style={styles.clubInitial}>{club.name?.charAt(0)}</Text>}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{club.name}</Text>
                    <Text style={styles.cardMeta}>{club.follower_count || 0} followers · {club.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </GlassCard>
              </Bounceable>
            </Animated.View>
          )) : (
            <View style={styles.emptyTab}>
              <Ionicons name="people-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTabText}>Follow clubs to see them here</Text>
            </View>
          )
        )}

        {/* Tab: My Clubs */}
        {activeTab === 'clubs' && (
          <>
            <Animated.View entering={FadeInDown.delay(0).springify()}>
              <TouchableOpacity style={styles.highlighterLinkCard} onPress={handleHighlanderLink} activeOpacity={0.85}>
                <LinearGradient colors={[theme.primary + '22', theme.cyan + '11']} style={styles.highlighterLinkGrad} />
                <Ionicons name="link" size={20} color={theme.cyan} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlighterLinkTitle}>Verify via Highlander Link</Text>
                  <Text style={styles.highlighterLinkSub}>Confirm club membership on UCR's official portal</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <TouchableOpacity style={styles.createClubBtn} onPress={() => router.push('/create-club' as any)}>
                <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                <Text style={styles.createClubText}>Create a New Club</Text>
              </TouchableOpacity>
            </Animated.View>

            {myClubs.length > 0 ? myClubs.map((club: any, idx) => {
              const isOfficer = OFFICER_ROLES.has(club.user_role);
              return (
                <Animated.View key={club.id} entering={FadeInDown.delay(120 + idx * 50).springify()}>
                  <Bounceable onPress={() => router.push(`/club/${club.id}` as any)}>
                    <GlassCard style={styles.card} intensity={50}>
                      <View style={[styles.clubIcon, { backgroundColor: theme.accent + '22' }]}>
                      {club.logo_url
                        ? <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
                        : <Text style={styles.clubInitial}>{club.name?.charAt(0)}</Text>}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{club.name}</Text>
                      <Text style={styles.cardMeta}>{club.follower_count || 0} followers · {club.user_role}</Text>
                    </View>
                    {isOfficer && (
                      <TouchableOpacity
                        style={styles.postEventBtn}
                        onPress={() => router.push({ pathname: '/create-event', params: { club_id: club.id, club_name: club.name } } as any)}
                      >
                        <LinearGradient colors={Gradients.accent} style={styles.postEventBtnGrad}>
                          <Ionicons name="add" size={14} color="#000" />
                          <Text style={styles.postEventBtnText}>Post</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    </GlassCard>
                  </Bounceable>
                </Animated.View>
              );
            }) : (
              <View style={styles.emptyTab}>
                <Ionicons name="shield-outline" size={36} color={theme.textMuted} />
                <Text style={styles.emptyTabText}>You're not a member of any clubs yet</Text>
                <Text style={styles.emptyTabSub}>Create a club or get invited by an officer</Text>
              </View>
            )}
          </>
        )}

        {/* Tab: Friends */}
        {activeTab === 'friends' && (
          friends.length > 0 ? friends.map((f: any, idx) => (
            <Animated.View key={f.id} entering={FadeInDown.delay(idx * 50).springify()}>
              <Bounceable>
                <GlassCard style={styles.card} intensity={50}>
                  <View style={styles.friendAvatar}>
                    {f.avatar_url
                      ? <Image source={{ uri: f.avatar_url }} style={styles.friendAvatarImg} />
                      : <Text style={styles.friendInitial}>{f.name?.charAt(0) || '?'}</Text>}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{f.name || 'Highlander'}</Text>
                    <Text style={styles.cardMeta}>{f.email}</Text>
                  </View>
                </GlassCard>
              </Bounceable>
            </Animated.View>
          )) : (
            <View style={styles.emptyTab}>
              <Ionicons name="people-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTabText}>No friends yet</Text>
              <Text style={styles.emptyTabSub}>Friends are added by club officers through the member system</Text>
            </View>
          )
        )}

        {/* Sign Out */}
        <Animated.View entering={FadeIn.delay(600)}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out', style: 'destructive',
                  onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/(auth)/login' as any);
                  },
                },
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  signInIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  signInTitle: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.lg, marginBottom: Spacing.lg },
  signInBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.glow('#1E6AFF') },
  signInBtnGrad: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  signInBtnText: { fontFamily: Fonts.headingMed, color: '#FFF', fontSize: FontSize.md },

  headerGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },

  profileHeader: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: Spacing.lg },

  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatarGlowRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2.5, borderColor: theme.accent + '88',
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.glow('#FFB800'),
  },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: theme.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarLetter: { fontFamily: Fonts.heading, color: theme.accent, fontSize: FontSize.xxxl },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13, backgroundColor: theme.accent,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.background,
    ...Shadows.soft,
  },

  displayName: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  email: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: FontSize.sm },
  ucrBadge: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  ucrBadgeGrad: { paddingHorizontal: 8, paddingVertical: 2 },
  ucrBadgeText: { fontFamily: Fonts.heading, color: '#FFF', fontSize: 9, letterSpacing: 0.5 },

  statsCard: {
    flexDirection: 'row', marginTop: Spacing.lg, marginHorizontal: Spacing.xl,
    backgroundColor: Glass.background, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Glass.border, paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: Glass.border },
  statNum: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl },
  statLabel: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  tabScroll: { marginBottom: Spacing.sm },
  tabRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs, flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Glass.background,
    borderWidth: 1, borderColor: Glass.border,
  },
  tabActive: { backgroundColor: theme.accent + '18', borderColor: theme.accent + '55' },
  tabText: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.sm },
  tabTextActive: { fontFamily: Fonts.headingMed, color: theme.accent },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: Spacing.md,
    backgroundColor: 'transparent', borderRadius: BorderRadius.md,
    borderWidth: 0,
  },
  cardIcon: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.md },
  cardMeta: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  attendingBadge: { backgroundColor: theme.success + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  attendingText: { fontFamily: Fonts.headingMed, color: theme.success, fontSize: 11 },

  clubIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  clubLogo: { width: 44, height: 44, borderRadius: 22 },
  clubInitial: { fontFamily: Fonts.heading, color: theme.accent, fontSize: FontSize.lg },

  highlighterLinkCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    overflow: 'hidden',
  },
  highlighterLinkGrad: { ...StyleSheet.absoluteFillObject },
  highlighterLinkTitle: { fontFamily: Fonts.headingMed, color: theme.cyan, fontSize: FontSize.md },
  highlighterLinkSub: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.xs, marginTop: 1 },

  createClubBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: Spacing.md,
    backgroundColor: Glass.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: theme.accent + '33', borderStyle: 'dashed',
  },
  createClubText: { fontFamily: Fonts.headingMed, color: theme.accent, fontSize: FontSize.md },

  postEventBtn: { borderRadius: BorderRadius.sm, overflow: 'hidden' },
  postEventBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6 },
  postEventBtnText: { fontFamily: Fonts.heading, color: '#000', fontSize: FontSize.xs },

  friendAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.surfaceElevated, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  friendAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  friendInitial: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.lg },

  emptyTab: { alignItems: 'center', marginTop: 48, paddingHorizontal: Spacing.xl },
  emptyTabText: { fontFamily: Fonts.headingMed, color: theme.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  emptyTabSub: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.sm, marginTop: 4, textAlign: 'center' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginTop: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.danger + '33',
    backgroundColor: theme.danger + '08',
  },
  signOutText: { fontFamily: Fonts.headingMed, color: theme.danger, fontSize: FontSize.md },
});
