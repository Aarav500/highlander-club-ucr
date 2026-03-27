import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { tickets as ticketsApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventTicketScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => { loadTicketInfo(); }, [id]);

  const loadTicketInfo = async () => {
    try {
      const data = await ticketsApi.getForEvent(id as string);
      setTicketInfo(data);
    } catch (err) {
      console.error('Ticket load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (purchasing) return;
    Alert.alert(
      ticketInfo.price > 0 ? `Purchase Ticket — $${ticketInfo.price}` : 'Get Free Ticket',
      'Confirm to get your ticket for this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          setPurchasing(true);
          try {
            const result = await ticketsApi.purchase(id as string);
            Alert.alert('🎉 Ticket Confirmed!', `Your code: ${result.ticket.ticket_code}`, [
              { text: 'OK', onPress: loadTicketInfo }
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to purchase ticket');
          } finally {
            setPurchasing(false);
          }
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!ticketInfo) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: theme.text }}>Ticket info unavailable</Text>
      </View>
    );
  }

  const isFree = ticketInfo.price === 0;
  const hasTicket = ticketInfo.user_has_ticket;
  const soldOut = ticketInfo.available !== null && ticketInfo.available <= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Ticket Card */}
      <View style={styles.ticketWrap}>
        <LinearGradient
          colors={['#2D6CC0', '#1a4a8a']}
          style={styles.ticketCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Top section */}
          <View style={styles.ticketTop}>
            <Ionicons name="ticket" size={32} color="#FFF" />
            <Text style={styles.ticketEventTitle} numberOfLines={2}>{ticketInfo.title}</Text>
          </View>

          {/* Dotted divider */}
          <View style={styles.ticketDivider}>
            <View style={[styles.ticketNotch, styles.ticketNotchLeft]} />
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.ticketDot} />
            ))}
            <View style={[styles.ticketNotch, styles.ticketNotchRight]} />
          </View>

          {/* Bottom section */}
          <View style={styles.ticketBottom}>
            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>PRICE</Text>
                <Text style={styles.ticketValue}>{isFree ? 'FREE' : `$${ticketInfo.price}`}</Text>
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>TYPE</Text>
                <Text style={styles.ticketValue}>{ticketInfo.type.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>AVAILABLE</Text>
                <Text style={styles.ticketValue}>
                  {ticketInfo.available !== null ? `${ticketInfo.available} / ${ticketInfo.total_quantity}` : 'Unlimited'}
                </Text>
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>SOLD</Text>
                <Text style={styles.ticketValue}>{ticketInfo.sold}</Text>
              </View>
            </View>

            {/* User's ticket code */}
            {hasTicket && ticketInfo.user_ticket && (
              <View style={styles.ticketCodeWrap}>
                <Text style={styles.ticketCodeLabel}>YOUR TICKET CODE</Text>
                <Text style={styles.ticketCode}>{ticketInfo.user_ticket.ticket_code}</Text>
                <Text style={styles.ticketCodeHint}>Show this at the door</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Action Button */}
      <View style={styles.actionArea}>
        {hasTicket ? (
          <View style={[styles.actionBtn, { backgroundColor: '#4ADE80' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>You Have a Ticket!</Text>
          </View>
        ) : soldOut ? (
          <View style={[styles.actionBtn, { backgroundColor: theme.danger || '#EF4444' }]}>
            <Ionicons name="close-circle" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>Sold Out</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={handlePurchase}
            disabled={purchasing}
            activeOpacity={0.8}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="ticket" size={22} color="#FFF" />
                <Text style={styles.actionBtnText}>
                  {isFree ? 'Get Free Ticket' : `Buy Ticket — $${ticketInfo.price}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },

  ticketWrap: { padding: Spacing.lg, flex: 1, justifyContent: 'center' },
  ticketCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  ticketTop: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  ticketEventTitle: { color: '#FFF', fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center' },
  ticketDivider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
  ticketNotch: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.dark.background, position: 'absolute' },
  ticketNotchLeft: { left: -10 },
  ticketNotchRight: { right: -10 },
  ticketDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 3 },
  ticketBottom: { padding: Spacing.xl, gap: Spacing.lg },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketField: { flex: 1 },
  ticketLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  ticketValue: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700' },
  ticketCodeWrap: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.sm },
  ticketCodeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: Spacing.xs },
  ticketCode: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  ticketCodeHint: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, marginTop: Spacing.xs },

  actionArea: { padding: Spacing.lg, paddingBottom: 40 },
  actionBtn: {
    height: 56, borderRadius: BorderRadius.lg, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
  },
  actionBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
});
