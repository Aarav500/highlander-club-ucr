import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { events as eventsApi } from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

function getWeekDays(offset: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = getWeekDays(weekOffset);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useFocusEffect(
    useCallback(() => { loadEvents(); }, [selectedDate])
  );

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await eventsApi.list().catch(() => []);
      const filtered = all.filter((e: any) => {
        const eventDate = new Date(e.start_time);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
      setEvents(filtered);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();
  const isPast = (iso: string) => new Date(iso) < new Date();

  const handleRSVP = async (eventId: string) => {
    try {
      const result = await eventsApi.rsvp(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, user_rsvped: result.rsvped, rsvp_count: String(result.rsvp_count) } : e));
    } catch (err: any) {
      if (err.message?.includes('full')) Alert.alert('Event Full', 'Maximum capacity reached.');
    }
  };

  const weekLabel = `${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => { setWeekOffset(0); setSelectedDate(new Date()); }}
        >
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Week Navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} style={styles.navArrow}>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dayCell, isSelected(day) && styles.dayCellSelected, isToday(day) && !isSelected(day) && styles.dayCellToday]}
            onPress={() => setSelectedDate(day)}
          >
            <Text style={[styles.dayName, isSelected(day) && styles.dayNameSelected]}>{dayNames[i]}</Text>
            <Text style={[styles.dayNum, isSelected(day) && styles.dayNumSelected]}>{day.getDate()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Date & Count */}
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>{selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={styles.eventCount}>{events.length} events</Text>
      </View>

      {/* Events List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const catColor = Colors.categories[item.category as keyof typeof Colors.categories] || theme.primary;
            const ended = isPast(item.end_time || item.start_time);
            return (
              <TouchableOpacity
                style={[styles.eventCard, ended && styles.eventCardEnded]}
                onPress={() => router.push(`/event/${item.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.catStripe, { backgroundColor: catColor }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventTop}>
                    <View style={styles.eventTime}>
                      <Ionicons name="time-outline" size={14} color={catColor} />
                      <Text style={[styles.eventTimeText, { color: catColor }]}>
                        {new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    {ended && (
                      <View style={styles.endedBadge}>
                        <Text style={styles.endedText}>Ended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.eventTitle, ended && { opacity: 0.5 }]} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.eventMeta}>
                    <Text style={styles.eventClub}>{item.club_name}</Text>
                    <View style={styles.eventLoc}>
                      <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                      <Text style={styles.eventLocText} numberOfLines={1}>{item.location || 'TBD'}</Text>
                    </View>
                  </View>
                  <View style={styles.eventActions}>
                    <View style={styles.attendees}>
                      <Ionicons name="people" size={14} color={theme.textMuted} />
                      <Text style={styles.attendeesText}>{item.rsvp_count || 0}</Text>
                    </View>
                    {!ended && (
                      <TouchableOpacity
                        style={[styles.rsvpBtn, item.user_rsvped && styles.rsvpBtnActive]}
                        onPress={() => handleRSVP(item.id)}
                      >
                        <Ionicons name={item.user_rsvped ? 'heart' : 'heart-outline'} size={14} color={item.user_rsvped ? '#FFF' : theme.accent} />
                        <Text style={[styles.rsvpText, item.user_rsvped && { color: '#FFF' }]}>{item.user_rsvped ? 'Going' : 'RSVP'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No events on this day</Text>
              <Text style={styles.emptySub}>Try another date or follow more clubs</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingTop: 56 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  monthTitle: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: '800' },
  todayBtn: { backgroundColor: Colors.dark.accent, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  todayBtnText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' },

  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  navArrow: { padding: 4 },
  weekLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.sm },

  weekStrip: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: Spacing.md },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  dayCellSelected: { backgroundColor: Colors.dark.primary },
  dayCellToday: { borderWidth: 1, borderColor: Colors.dark.accent },
  dayName: { color: Colors.dark.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 4 },
  dayNameSelected: { color: '#FFF' },
  dayNum: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },
  dayNumSelected: { color: '#FFF' },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  dateLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.sm },
  eventCount: { color: Colors.dark.textMuted, fontSize: FontSize.xs },

  eventCard: {
    flexDirection: 'row', backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm, overflow: 'hidden',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
  },
  eventCardEnded: { opacity: 0.6 },
  catStripe: { width: 4 },
  eventContent: { flex: 1, padding: Spacing.md },

  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eventTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventTimeText: { fontSize: FontSize.xs, fontWeight: '600' },
  endedBadge: { backgroundColor: Colors.dark.danger + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  endedText: { color: Colors.dark.danger, fontSize: 10, fontWeight: '600' },

  eventTitle: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  eventClub: { color: Colors.dark.textSecondary, fontSize: FontSize.xs },
  eventLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventLocText: { color: Colors.dark.textMuted, fontSize: 11, maxWidth: 120 },

  eventActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendees: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { color: Colors.dark.textMuted, fontSize: FontSize.xs },

  rsvpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.dark.accent },
  rsvpBtnActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  rsvpText: { color: Colors.dark.accent, fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: '600' },
  emptySub: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
});
