import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, AnimTiming } from '../../constants/Colors';
import { useSpringPress, useFadeIn } from '../../constants/animations';
import { events as eventsApi } from '../../services/api';
import { AmbientBackground, Bounceable, GlassCard } from '../../components/GlassComponents';

const SCREEN_WIDTH = Dimensions.get('window').width;
const theme = Colors.dark;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = getWeekDays(weekOffset);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const headerFade = useFadeIn({ delay: 0, translateY: -10 });

  useFocusEffect(useCallback(() => { loadEvents(); }, [selectedDate]));

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
      <AmbientBackground />
      {/* Header */}
      <Animated.View style={[styles.header, headerFade.animatedStyle]}>
        <Text style={styles.monthTitle}>{selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity style={styles.todayBtn} onPress={() => { setWeekOffset(0); setSelectedDate(new Date()); }}>
          <LinearGradient colors={['#FFB800', '#CC9200']} style={styles.todayBtnGrad}>
            <Text style={styles.todayBtnText}>Today</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
        {weekDays.map((day, i) => {
          const selected = isSelected(day);
          const today = isToday(day);
          return (
            <Bounceable
              key={i}
              style={[styles.dayCell, selected && styles.dayCellSelected, today && !selected && styles.dayCellToday]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[styles.dayName, selected && styles.dayNameSelected]}>{dayNames[i]}</Text>
              <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{day.getDate()}</Text>
              {selected && <View style={styles.selectedDot} />}
            </Bounceable>
          );
        })}
      </View>

      {/* Selected Date & Count */}
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>{selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.eventCount}>{events.length}</Text>
        </View>
      </View>

      {/* Events List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const catColor = Colors.categories[item.category as keyof typeof Colors.categories] || theme.primary;
            const ended = isPast(item.end_time || item.start_time);
            return (
              <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
                <Bounceable
                  onPress={() => router.push(`/event/${item.id}` as any)}
                >
                  <GlassCard
                    style={[styles.eventCard, ended && styles.eventCardEnded]}
                    intensity={50}
                  >
                    <View style={[styles.catStripe, { backgroundColor: catColor }]}>
                      <LinearGradient colors={[catColor, catColor + '66']} style={StyleSheet.absoluteFill} />
                    </View>
                    <View style={styles.eventContent}>
                      <View style={styles.eventTop}>
                        <View style={styles.eventTime}>
                          <View style={[styles.timeIcon, { backgroundColor: catColor + '22' }]}>
                            <Ionicons name="time-outline" size={12} color={catColor} />
                          </View>
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
                          <Bounceable
                            style={[styles.rsvpBtn, item.user_rsvped && styles.rsvpBtnActive]}
                            onPress={() => handleRSVP(item.id)}
                          >
                            <Ionicons name={item.user_rsvped ? 'heart' : 'heart-outline'} size={14} color={item.user_rsvped ? '#FFF' : theme.accent} />
                            <Text style={[styles.rsvpText, item.user_rsvped && { color: '#FFF' }]}>{item.user_rsvped ? 'Going' : 'RSVP'}</Text>
                          </Bounceable>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </Bounceable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <Animated.View style={styles.emptyState} entering={ZoomIn.springify().damping(14)}>
              <View style={styles.emptyCircle}>
                <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No events on this day</Text>
              <Text style={styles.emptySub}>Try another date or follow more clubs</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === 'ios' ? 56 : 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  monthTitle: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.xl },
  todayBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.glowSmall('#FFB800') },
  todayBtnGrad: { paddingHorizontal: Spacing.md, paddingVertical: 6 },
  todayBtnText: { fontFamily: Fonts.heading, color: '#000', fontSize: FontSize.xs },

  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  navArrow: { padding: 4 },
  weekLabel: { color: theme.textSecondary, fontSize: FontSize.sm, fontFamily: Fonts.body },

  weekStrip: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: Spacing.md },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, position: 'relative' },
  dayCellSelected: { backgroundColor: theme.primary, ...Shadows.glowSmall('#1E6AFF') },
  dayCellToday: { borderWidth: 1, borderColor: theme.accent + '66' },
  dayName: { fontFamily: Fonts.body, color: theme.textMuted, fontSize: 10, marginBottom: 4 },
  dayNameSelected: { color: 'rgba(255,255,255,0.8)' },
  dayNum: { fontFamily: Fonts.heading, color: theme.text, fontSize: FontSize.lg },
  dayNumSelected: { color: '#FFF' },
  selectedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginTop: 4 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  dateLabel: { color: theme.textSecondary, fontSize: FontSize.sm, fontFamily: Fonts.body },
  countBadge: {
    backgroundColor: theme.accent + '22', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: theme.accent + '44',
  },
  eventCount: { color: theme.accent, fontSize: FontSize.xs, fontFamily: Fonts.heading },

  eventCard: {
    flexDirection: 'row', backgroundColor: 'transparent', borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm, overflow: 'hidden', borderWidth: 0,
    ...Shadows.card,
  },
  eventCardEnded: { opacity: 0.6 },
  catStripe: { width: 4, overflow: 'hidden' },
  eventContent: { flex: 1, padding: Spacing.md },

  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eventTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeIcon: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  eventTimeText: { fontSize: FontSize.xs, fontFamily: Fonts.headingMed },
  endedBadge: { backgroundColor: theme.danger + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  endedText: { color: theme.danger, fontSize: 10, fontFamily: Fonts.headingMed },

  eventTitle: { fontFamily: Fonts.headingMed, color: theme.text, fontSize: FontSize.md, marginBottom: 4 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  eventClub: { fontFamily: Fonts.body, color: theme.textSecondary, fontSize: FontSize.xs },
  eventLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventLocText: { color: theme.textMuted, fontSize: 11, maxWidth: 120, fontFamily: Fonts.body },

  eventActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendees: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { color: theme.textMuted, fontSize: FontSize.xs, fontFamily: Fonts.body },

  rsvpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 5, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: theme.accent, backgroundColor: 'transparent',
  },
  rsvpBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  rsvpText: { color: theme.accent, fontSize: 11, fontFamily: Fonts.headingMed },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  emptyTitle: { color: theme.text, fontSize: FontSize.md, fontFamily: Fonts.headingMed },
  emptySub: { color: theme.textSecondary, fontSize: FontSize.sm, marginTop: 4, fontFamily: Fonts.body },
});
