import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass } from '../../constants/Colors';
import { claimsApi } from '../../services/api';

const theme = Colors.dark;

export default function ClaimsAdminScreen() {
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadClaims(); }, []);

  const loadClaims = async () => {
    try { setClaims(await claimsApi.listPending()); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleApprove = async (claim: any) => {
    Alert.alert('Approve', `Grant ${claim.profiles?.name} the role of ${claim.role} in ${claim.clubs?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          await claimsApi.approve(claim.id);
          setClaims(prev => prev.filter(c => c.id !== claim.id));
          Alert.alert('Approved ✅');
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleReject = async (claim: any) => {
    Alert.alert('Reject', `Reject ${claim.profiles?.name}'s claim for ${claim.clubs?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await claimsApi.reject(claim.id);
          setClaims(prev => prev.filter(c => c.id !== claim.id));
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Club Claim Requests</Text>
        <Text style={styles.sub}>{claims.length} pending</Text>
      </View>

      {loading ? <ActivityIndicator color={theme.accent} style={{ marginTop: 60 }} /> : (
        <FlatList
          data={claims}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyText}>No pending claims</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.clubPill}>
                  <Text style={styles.clubName}>{item.clubs?.name}</Text>
                  <Text style={styles.category}>{item.clubs?.category}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.role?.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.userName}>{item.profiles?.name} · {item.profiles?.email}</Text>
              {item.message && <Text style={styles.message}>{item.message}</Text>}
              <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                  <Ionicons name="close" size={18} color={theme.danger} />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                  <Ionicons name="checkmark" size={18} color="#000" />
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Glass.border },
  back: { marginBottom: Spacing.xs },
  title: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl },
  sub: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.sm },

  card: { backgroundColor: Glass.background, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Glass.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  clubPill: { flex: 1 },
  clubName: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.md },
  category: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.xs },
  roleBadge: { backgroundColor: theme.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.primary + '44' },
  roleText: { fontFamily: Fonts.headingMed, color: theme.primary, fontSize: FontSize.xs, textTransform: 'capitalize' },
  userName: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  message: { fontFamily: Fonts.body, color: theme.text, fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.xs, fontStyle: 'italic' },
  time: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.danger + '55', backgroundColor: theme.danger + '11' },
  rejectText: { fontFamily: Fonts.headingMed, color: theme.danger, fontSize: FontSize.sm },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: '#4ADE80' },
  approveText: { fontFamily: Fonts.headingMed, color: '#000', fontSize: FontSize.sm },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
