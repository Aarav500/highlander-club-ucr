import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { clubs as clubsApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClubDashboardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, [id]);

  const loadDashboard = async () => {
    try {
      const stats = await clubsApi.dashboard(id as string);
      setData(stats);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!data) return null;

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    color: (opacity = 1) => `rgba(241, 171, 0, ${opacity})`, // Gold
    labelColor: (opacity = 1) => theme.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };
  
  const viewsChartConfig = { ...chartConfig, color: (opacity = 1) => `rgba(45, 108, 192, ${opacity})` }; // Blue

  // Prepare chart data (limit to 5 most recent events to prevent overcrowding)
  const recentEvents = [...(data.events || [])].reverse().slice(-5);
  
  const rsvpData = {
    labels: recentEvents.map((e: any) => e.title.length > 10 ? e.title.substring(0, 10) + '...' : e.title),
    datasets: [{ data: recentEvents.map((e: any) => parseInt(e.rsvp_count) || 0) }]
  };

  const viewsData = {
    labels: recentEvents.map((e: any) => e.title.length > 10 ? e.title.substring(0, 10) + '...' : e.title),
    datasets: [{ data: recentEvents.map((e: any) => parseInt(e.views) || 0) }]
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top-level KPIs */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="people" size={24} color={theme.primary} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{data.follower_count}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Followers</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="calendar" size={24} color={theme.accent} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{data.event_count}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Events</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="eye" size={24} color={theme.primary} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{data.total_views}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Views</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="heart" size={24} color={theme.accent} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{data.total_rsvps}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total RSVPs</Text>
          </View>
        </View>

        {/* Charts */}
        {recentEvents.length > 0 && (
          <>
            <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>RSVPs per Event</Text>
              <BarChart
                data={rsvpData}
                width={SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={{ borderRadius: BorderRadius.md, marginTop: Spacing.md }}
                showValuesOnTopOfBars={true}
              />
            </View>

            <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Views per Event</Text>
              <BarChart
                data={viewsData}
                width={SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={viewsChartConfig}
                style={{ borderRadius: BorderRadius.md, marginTop: Spacing.md }}
                showValuesOnTopOfBars={true}
              />
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.lg },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  metricCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  metricValue: { fontSize: 28, fontWeight: '800', marginTop: Spacing.sm },
  metricLabel: { fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase' },
  chartContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  chartTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: -10 },
});
