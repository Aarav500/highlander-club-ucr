import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { clubs as clubsApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabKey = 'staff' | 'events' | 'analytics' | 'settings';

const ROLE_LABELS: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  officer: 'Officer',
  moderator: 'Moderator',
  member: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  president: '#F1AB00',
  vice_president: '#2D6CC0',
  officer: '#4ADE80',
  moderator: '#A78BFA',
  member: '#94A3B8',
};

const INVITABLE_ROLES = [
  { value: 'vice_president', label: 'Vice President' },
  { value: 'officer', label: 'Officer' },
  { value: 'moderator', label: 'Moderator' },
];

export default function AdminPanelScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;

  const [activeTab, setActiveTab] = useState<TabKey>('staff');
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('officer');
  const [inviting, setInviting] = useState(false);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [id]));

  const loadData = async () => {
    setLoading(true);
    try {
      const [staff, dashboard, inviteList] = await Promise.all([
        clubsApi.staff(id as string).catch(() => null),
        clubsApi.dashboard(id as string).catch(() => null),
        clubsApi.staffInvites(id as string).catch(() => []),
      ]);
      setStaffData(staff);
      setDashboardData(dashboard);
      setInvites(Array.isArray(inviteList) ? inviteList : []);
    } catch (err) {
      console.error('Admin panel load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.endsWith('@ucr.edu')) {
      Alert.alert('Invalid Email', 'Please enter a @ucr.edu email address');
      return;
    }
    setInviting(true);
    try {
      await clubsApi.inviteStaff(id as string, inviteEmail, inviteRole);
      Alert.alert('Success', `Invited ${inviteEmail} as ${ROLE_LABELS[inviteRole]}`);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = (userId: string, userName: string, currentRole: string) => {
    const options = INVITABLE_ROLES
      .filter(r => r.value !== currentRole)
      .concat([{ value: 'member', label: 'Demote to Member' }]);

    Alert.alert(
      `Change ${userName}'s Role`,
      `Current: ${ROLE_LABELS[currentRole]}`,
      [
        ...options.map(opt => ({
          text: opt.label,
          onPress: async () => {
            try {
              await clubsApi.updateStaffRole(id as string, userId, opt.value);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to change role');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleRemove = (userId: string, userName: string) => {
    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to remove ${userName} from the club staff?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await clubsApi.removeStaff(id as string, userId);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove staff');
            }
          },
        },
      ]
    );
  };

  const handleTransfer = (userId: string, userName: string) => {
    Alert.alert(
      'Transfer Presidency',
      `Are you sure you want to make ${userName} the new President? You will become Vice President.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clubsApi.transferPresidency(id as string, userId);
              Alert.alert('Done', `${userName} is now the President`);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to transfer');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const myRole = staffData?.your_role || dashboardData?.your_role;
  const canManageStaff = ['president', 'vice_president'].includes(myRole);
  const isPresident = myRole === 'president';

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'staff', label: 'Staff', icon: 'people' },
    { key: 'events', label: 'Events', icon: 'calendar' },
    { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.text }]}>Admin Panel</Text>
          {myRole && (
            <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[myRole] + '22' }]}>
              <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[myRole] }]}>
                {ROLE_LABELS[myRole]}
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? theme.accent : theme.textMuted}
            />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? theme.accent : theme.textMuted }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ─── Staff Tab ─────────────────────────────────────────────── */}
        {activeTab === 'staff' && (
          <>
            {/* Invite Form */}
            {canManageStaff && (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Invite Staff Member</Text>
                <View style={styles.inviteForm}>
                  <TextInput
                    style={[styles.inviteInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="student@ucr.edu"
                    placeholderTextColor={theme.textMuted}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.roleSelector}>
                    {INVITABLE_ROLES.map(r => (
                      <TouchableOpacity
                        key={r.value}
                        style={[
                          styles.roleOption,
                          { borderColor: theme.border },
                          inviteRole === r.value && { borderColor: ROLE_COLORS[r.value], backgroundColor: ROLE_COLORS[r.value] + '15' },
                        ]}
                        onPress={() => setInviteRole(r.value)}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          { color: inviteRole === r.value ? ROLE_COLORS[r.value] : theme.textSecondary },
                        ]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.inviteBtn, { backgroundColor: theme.accent, opacity: inviting ? 0.6 : 1 }]}
                    onPress={handleInvite}
                    disabled={inviting}
                  >
                    {inviting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={16} color="#FFF" />
                        <Text style={styles.inviteBtnText}>Send Invite</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Staff List */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Club Staff ({staffData?.total || 0})
              </Text>
              {(staffData?.staff || []).map((member: any) => (
                <View key={member.id} style={[styles.staffRow, { borderBottomColor: theme.border }]}>
                  <View style={[styles.staffAvatar, { backgroundColor: ROLE_COLORS[member.role] + '22' }]}>
                    <Text style={[styles.staffInitial, { color: ROLE_COLORS[member.role] }]}>
                      {(member.display_name || member.name || member.email)?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={[styles.staffName, { color: theme.text }]}>
                      {member.display_name || member.name}
                    </Text>
                    <Text style={[styles.staffEmail, { color: theme.textSecondary }]}>{member.email}</Text>
                    <View style={[styles.roleTag, { backgroundColor: ROLE_COLORS[member.role] + '22' }]}>
                      <Text style={[styles.roleTagText, { color: ROLE_COLORS[member.role] }]}>
                        {ROLE_LABELS[member.role]}
                      </Text>
                    </View>
                  </View>
                  {canManageStaff && member.role !== 'president' && (
                    <View style={styles.staffActions}>
                      <TouchableOpacity
                        style={styles.staffActionBtn}
                        onPress={() => handleChangeRole(member.id, member.display_name || member.name, member.role)}
                      >
                        <Ionicons name="swap-horizontal" size={18} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.staffActionBtn}
                        onPress={() => handleRemove(member.id, member.display_name || member.name)}
                      >
                        <Ionicons name="close-circle" size={18} color={theme.danger} />
                      </TouchableOpacity>
                      {isPresident && (
                        <TouchableOpacity
                          style={styles.staffActionBtn}
                          onPress={() => handleTransfer(member.id, member.display_name || member.name)}
                        >
                          <Ionicons name="key" size={18} color={theme.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Pending Invites ({invites.filter(i => i.status === 'pending').length})
                </Text>
                {invites.map((invite: any) => (
                  <View key={invite.id} style={[styles.staffRow, { borderBottomColor: theme.border }]}>
                    <View style={[styles.staffAvatar, { backgroundColor: theme.surfaceElevated }]}>
                      <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={[styles.staffName, { color: theme.text }]}>{invite.invited_email}</Text>
                      <Text style={[styles.staffEmail, { color: theme.textSecondary }]}>
                        {ROLE_LABELS[invite.role]} · {invite.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ─── Events Tab ────────────────────────────────────────────── */}
        {activeTab === 'events' && dashboardData && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Manage Events</Text>
            <TouchableOpacity
              style={[styles.createEventBtn, { backgroundColor: theme.accent }]}
              onPress={() => router.push(`/club/${id}` as any)}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.createEventText}>Create New Event</Text>
            </TouchableOpacity>
            {(dashboardData.events || []).map((event: any) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventRow, { borderBottomColor: theme.border }]}
                onPress={() => router.push(`/event/${event.id}` as any)}
              >
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>{event.title}</Text>
                  <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
                    {new Date(event.start_time).toLocaleDateString()} · {event.rsvp_count} RSVPs · {event.views} views
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Analytics Tab ─────────────────────────────────────────── */}
        {activeTab === 'analytics' && dashboardData && (
          <>
            <View style={styles.metricsGrid}>
              {[
                { icon: 'people', label: 'Followers', value: dashboardData.follower_count, color: theme.primary },
                { icon: 'calendar', label: 'Events', value: dashboardData.event_count, color: theme.accent },
                { icon: 'eye', label: 'Total Views', value: dashboardData.total_views, color: theme.primary },
                { icon: 'heart', label: 'Total RSVPs', value: dashboardData.total_rsvps, color: theme.accent },
              ].map((metric, i) => (
                <View key={i} style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                  <Ionicons name={metric.icon as any} size={24} color={metric.color} />
                  <Text style={[styles.metricValue, { color: theme.text }]}>{metric.value}</Text>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Settings Tab ──────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Club Settings</Text>
            
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
              onPress={() => router.push(`/club-dashboard/${id}` as any)}
            >
              <Ionicons name="bar-chart" size={20} color={theme.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Detailed Dashboard</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
              onPress={() => router.push(`/club-chat/${id}` as any)}
            >
              <Ionicons name="chatbubbles" size={20} color={theme.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Club Chat</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {isPresident && (
              <View style={[styles.dangerZone, { borderColor: theme.danger + '44' }]}>
                <Text style={[styles.dangerTitle, { color: theme.danger }]}>Danger Zone</Text>
                <Text style={[styles.dangerText, { color: theme.textSecondary }]}>
                  Transfer presidency to another officer using the Staff tab.
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center', gap: 4 },
  title: { fontSize: FontSize.lg, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: BorderRadius.md, padding: 3,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', gap: 2, borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: 'rgba(241,171,0,0.1)' },
  tabLabel: { fontSize: 11, fontWeight: '600' },

  scrollContent: { padding: Spacing.md, paddingBottom: 100 },

  // Cards
  card: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },

  // Invite Form
  inviteForm: { gap: Spacing.sm },
  inviteInput: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  roleSelector: { flexDirection: 'row', gap: Spacing.xs },
  roleOption: {
    flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm,
    borderWidth: 1, alignItems: 'center',
  },
  roleOptionText: { fontSize: 12, fontWeight: '600' },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  inviteBtnText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },

  // Staff List
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5,
  },
  staffAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  staffInitial: { fontSize: FontSize.lg, fontWeight: '700' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: FontSize.md, fontWeight: '600' },
  staffEmail: { fontSize: FontSize.xs, marginTop: 1 },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 4 },
  roleTagText: { fontSize: 10, fontWeight: '700' },
  staffActions: { flexDirection: 'row', gap: Spacing.xs },
  staffActionBtn: { padding: 6 },

  // Events
  createEventBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  createEventText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '600' },
  eventMeta: { fontSize: FontSize.xs, marginTop: 2 },

  // Analytics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  metricCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.md) / 2,
    padding: Spacing.lg, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  metricValue: { fontSize: 28, fontWeight: '800', marginTop: Spacing.sm },
  metricLabel: { fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase' },

  // Settings
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 0.5,
  },
  settingLabel: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  dangerZone: {
    marginTop: Spacing.lg, padding: Spacing.md,
    borderWidth: 1, borderRadius: BorderRadius.md,
  },
  dangerTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  dangerText: { fontSize: FontSize.sm, lineHeight: 20 },
});
