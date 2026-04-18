import { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows } from '../../constants/Colors';
import { useFadeIn } from '../../constants/animations';
import { events as eventsApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// UCR campus center
const UCR_CENTER = { lat: 33.9737, lng: -117.3281 };
const MAP_ZOOM = 16;

// ── Known UCR locations ──────────────────────────────────────
const UCR_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'HUB 302': { lat: 33.97350, lng: -117.32800 },
  'Student Recreation Center': { lat: 33.97200, lng: -117.32600 },
  'Highlander Union Building': { lat: 33.97350, lng: -117.32800 },
  'Bell Tower': { lat: 33.97400, lng: -117.32850 },
  'Bell Tower Lawn': { lat: 33.97410, lng: -117.32840 },
  'Arts Building': { lat: 33.97500, lng: -117.32750 },
  'Lot 30': { lat: 33.97100, lng: -117.32900 },
  'Rivera Library Lawn': { lat: 33.97450, lng: -117.32700 },
  'University Lecture Hall': { lat: 33.97380, lng: -117.32950 },
  'Pierce Hall': { lat: 33.97550, lng: -117.32650 },
  'Bourns A125': { lat: 33.97600, lng: -117.32550 },
  'Bourns A265': { lat: 33.97610, lng: -117.32540 },
  'Winston Chung Hall 138': { lat: 33.97580, lng: -117.32620 },
  'Winston Chung Hall 205': { lat: 33.97585, lng: -117.32625 },
  'UCR Campus': { lat: 33.97370, lng: -117.32810 },
  'UCR Soccer Field': { lat: 33.97150, lng: -117.32500 },
  'Career Center': { lat: 33.97300, lng: -117.32750 },
  'Orbach Library 240': { lat: 33.97420, lng: -117.32720 },
  'University Theatre': { lat: 33.97460, lng: -117.32880 },
};

interface MapEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  club_name: string;
  start_time: string;
  rsvp_count: string;
  lat?: number;
  lng?: number;
}

// ── Leaflet Web Map Component (real interactive map) ─────────
function LeafletWebMap({
  events,
  selectedEvent,
  onSelectEvent,
  height,
}: {
  events: MapEvent[];
  selectedEvent: MapEvent | null;
  onSelectEvent: (e: MapEvent | null) => void;
  height: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    // Dynamically load Leaflet CSS + JS
    const loadLeaflet = async () => {
      // Add Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const css = document.createElement('link');
        css.id = 'leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || mapRef.current) return;

      // Create map
      const map = L.map(containerRef.current, {
        center: [UCR_CENTER.lat, UCR_CENTER.lng],
        zoom: MAP_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      // Add high-quality tile layer — CartoDB Voyager (clean, modern, colorful)
      L.tileLayer(
        'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        {
          maxZoom: 20,
          attribution: '© OpenStreetMap · CARTO',
        }
      ).addTo(map);

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add attribution
      L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

      mapRef.current = map;

      // Add markers
      updateMarkers(L, map, events);
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current || Platform.OS !== 'web') return;
    const L = (window as any).L;
    if (!L) return;
    updateMarkers(L, mapRef.current, events);
  }, [events]);

  // Highlight selected marker
  useEffect(() => {
    if (!mapRef.current || Platform.OS !== 'web') return;
    markersRef.current.forEach((m) => {
      const el = m.getElement?.();
      if (!el) return;
      if (selectedEvent && m._eventId === selectedEvent.id) {
        el.style.transform += ' scale(1.4)';
        el.style.zIndex = '1000';
        el.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.6))';
      } else {
        el.style.zIndex = '100';
        el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))';
      }
    });
  }, [selectedEvent]);

  function updateMarkers(L: any, map: any, evts: MapEvent[]) {
    // Clear existing
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    evts.forEach((event) => {
      if (!event.lat || !event.lng) return;
      const catColor =
        Colors.categories[event.category as keyof typeof Colors.categories] ||
        Colors.dark.primary;

      // Create custom HTML icon
      const icon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
            background: ${catColor}; transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            border: 2px solid white;
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([event.lat, event.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${event.title}</div>
            <div style="color: ${catColor}; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${event.category}</div>
            <div style="color: #666; font-size: 12px;">📍 ${event.location}</div>
            <div style="color: #666; font-size: 12px;">🏫 ${event.club_name}</div>
            <div style="color: #666; font-size: 12px;">👥 ${event.rsvp_count || 0} going</div>
          </div>`,
          { closeButton: false, className: 'event-popup' }
        );

      (marker as any)._eventId = event.id;
      marker.on('click', () => {
        onSelectEvent(event);
      });

      markersRef.current.push(marker);
    });
  }

  if (Platform.OS !== 'web') return null;

  return (
    <div
      ref={containerRef as any}
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    />
  );
}

// ── Main Map Screen ──────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const result = await eventsApi.list();
      const mapped = result.map((e: any) => {
        const coords = UCR_LOCATIONS[e.location] || {
          lat: UCR_CENTER.lat + (Math.random() - 0.5) * 0.004,
          lng: UCR_CENTER.lng + (Math.random() - 0.5) * 0.004,
        };
        return { ...e, ...coords };
      });
      setEvents(mapped);
    } catch (err) {
      console.warn('Map: could not load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Object.keys(Colors.categories)];
  const filteredEvents =
    selectedCategory === 'All'
      ? events
      : events.filter((e) => e.category === selectedCategory);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Map</Text>
        <Text style={styles.headerSub}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} on campus
        </Text>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const color =
            cat === 'All'
              ? theme.accent
              : Colors.categories[cat as keyof typeof Colors.categories] || theme.primary;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pill,
                active && { backgroundColor: color + '33', borderColor: color },
              ]}
              onPress={() => {
                setSelectedCategory(cat);
                setSelectedEvent(null);
              }}
            >
              <Text style={[styles.pillText, { color: active ? color : theme.textSecondary }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Interactive Leaflet Map ── */}
      <View style={styles.mapWrap}>
        <LeafletWebMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          height={420}
        />
      </View>

      {/* Selected Event Card */}
      {selectedEvent && (
        <Animated.View entering={FadeInDown.springify().damping(18)}>
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/event/${selectedEvent.id}` as any)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.cardDot,
                {
                  backgroundColor:
                    Colors.categories[selectedEvent.category as keyof typeof Colors.categories] ||
                    theme.primary,
                  ...Shadows.glowSmall(Colors.categories[selectedEvent.category as keyof typeof Colors.categories] || theme.primary),
                },
              ]}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedEvent.title}
              </Text>
              <Text style={styles.cardMeta}>
                {selectedEvent.club_name} · {formatTime(selectedEvent.start_time)}
              </Text>
              <View style={styles.cardRow}>
                <Ionicons name="location" size={12} color={theme.accent} />
                <Text style={styles.cardLoc}>
                  {selectedEvent.location}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="people" size={12} color={theme.textSecondary} />
                <Text style={styles.cardPeople}>
                  {selectedEvent.rsvp_count} going
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Event List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const catColor =
            Colors.categories[item.category as keyof typeof Colors.categories] || theme.primary;
          const active = selectedEvent?.id === item.id;
          return (
            <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(18)}>
              <TouchableOpacity
                style={[
                  styles.listItem,
                  {
                    backgroundColor: active ? catColor + '15' : Glass.background,
                    borderColor: active ? catColor : Glass.border,
                  },
                ]}
                onPress={() => {
                  setSelectedEvent(item);
                  router.push(`/event/${item.id}` as any);
                }}
              >
                <View style={[styles.listDot, { backgroundColor: catColor, ...Shadows.glowSmall(catColor) }]} />
                <View style={styles.listBody}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.listMeta}>
                    {item.location} · {formatTime(item.start_time)}
                  </Text>
                </View>
                <Text style={[styles.listBadge, { color: catColor }]}>{item.category}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No events on campus</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Follow some clubs to see their events here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 40 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  headerTitle: { fontSize: FontSize.xl, fontFamily: Fonts.heading, color: Colors.dark.text },
  headerSub: { fontSize: FontSize.sm, fontFamily: Fonts.body, color: Colors.dark.textSecondary, marginTop: 2 },

  filterBar: { maxHeight: 40, marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Glass.border,
  },
  pillText: { fontSize: FontSize.xs, fontFamily: Fonts.headingMed },

  mapWrap: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: 420,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Glass.border,
    ...Shadows.card,
  },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Glass.background,
    borderWidth: 1,
    borderColor: Glass.border,
    ...Shadows.card,
  },
  cardDot: { width: 12, height: 12, borderRadius: 6 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontFamily: Fonts.headingMed, color: Colors.dark.text },
  cardMeta: { fontSize: FontSize.xs, fontFamily: Fonts.body, color: Colors.dark.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  cardLoc: { fontSize: FontSize.xs, fontFamily: Fonts.headingMed, color: Colors.dark.accent },
  cardPeople: { fontSize: FontSize.xs, fontFamily: Fonts.body, color: Colors.dark.textSecondary },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listBody: { flex: 1 },
  listTitle: { fontSize: FontSize.sm, fontFamily: Fonts.headingMed, color: Colors.dark.text },
  listMeta: { fontSize: FontSize.xs, fontFamily: Fonts.body, color: Colors.dark.textSecondary },
  listBadge: { fontSize: 10, fontFamily: Fonts.heading },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyTitle: { fontSize: FontSize.md, fontFamily: Fonts.headingMed, color: Colors.dark.text },
  emptySub: { fontSize: FontSize.sm, fontFamily: Fonts.body, color: Colors.dark.textSecondary },
});
