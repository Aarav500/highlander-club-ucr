import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Share, Dimensions, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, Gradients } from '../../constants/Colors';
import { useSpringPress } from '../../constants/animations';
import { events as eventsApi, getAuthToken, API_URL } from '../../services/api';
import { Bounceable, GlassCard } from '../../components/GlassComponents';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const theme = Colors.dark;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [friends, setFriends] = useState<any>({ friends: [], count: 0 });
  const [attendees, setAttendees] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [-100, 0, 300], [-50, 0, 150], Extrapolation.CLAMP)
        },
        {
          scale: interpolate(scrollY.value, [-100, 0], [1.3, 1], Extrapolation.CLAMP)
        }
      ]
    };
  });

  useEffect(() => { loadEvent(); }, [id]);

  const loadEvent = async () => {
    try {
      const [eventData, friendsData, attendeeData, photosData] = await Promise.all([
        eventsApi.get(id as string), eventsApi.friends(id as string),
        eventsApi.attendees(id as string), eventsApi.photos(id as string)
      ]);
      setEvent(eventData); setFriends(friendsData); setAttendees(attendeeData); setPhotos(photosData);
    } catch (err) { console.error('Event load error:', err); }
    finally { setLoading(false); }
  };

  const handleRSVP = async () => {
    try {
      const result = await eventsApi.rsvp(id as string);
      setEvent((prev: any) => ({ ...prev, user_rsvped: result.rsvped, rsvp_count: String(result.rsvp_count) }));
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('full')) Alert.alert('Event Full', 'Maximum capacity reached.');
    }
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Check out "${event.title}"! 🎉\nunipulse://event/${id}`, title: event.title }); } catch {}
  };

  const handleUploadPhoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.canceled && result.assets?.length > 0) {
        setUploading(true);
        const asset = result.assets[0];
        const res = await fetch(`${API_URL}/api/upload/presign?contentType=image/jpeg`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        const { uploadUrl, publicUrl } = await res.json();
        const imageRes = await fetch(asset.uri); const blob = await imageRes.blob();
        await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
        await eventsApi.update(id as string, { photo_url: publicUrl });
        await fetch(`${API_URL}/api/events/${id}/photos`, {
          method: 'POST', headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: publicUrl })
        });
        loadEvent();
      }
    } catch (e: any) { Alert.alert('Upload Error', e.message); }
    finally { setUploading(false); }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await fetch(`${API_URL}/api/events/${id}/photos/${photoId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` } }); loadEvent(); } catch {}
      }}
    ]);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!event) return <View style={[styles.container, styles.centered]}><Text style={{ color: theme.text }}>Event not found</Text></View>;

  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero Image */}
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: catColor + '22' }]}>
              <LinearGradient colors={[catColor + '44', catColor + '11']} style={StyleSheet.absoluteFill} />
              <Ionicons name="calendar" size={80} color={catColor} />
            </View>
          )}
          <LinearGradient colors={['rgba(5,8,16,0.5)', 'transparent', 'rgba(5,8,16,0.9)']} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <View style={styles.glassBtnBg}><Ionicons name="chevron-back" size={24} color="#FFF" /></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <View style={styles.glassBtnBg}><Ionicons name="share-outline" size={22} color="#FFF" /></View>
          </TouchableOpacity>
        </Animated.View>

        {/* Content (slides up over hero) */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <Text style={[styles.categoryText, { color: catColor }]}>{event.category}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={styles.title}>{event.title}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity style={styles.clubRow} onPress={() => router.push(`/club/${event.club_id}` as any)}>
              <View style={[styles.clubLogo, { backgroundColor: theme.primary }]}><Ionicons name="people" size={14} color="#FFF" /></View>
              <Text style={[styles.clubName, { color: theme.primary }]}>{event.club_name}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Meta info — glass card */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <GlassCard style={styles.metaCard} intensity={50}>
              {[
                { icon: 'calendar', text: formatDateTime(event.start_time) },
                { icon: 'time', text: `Until ${formatDateTime(event.end_time).split(' at ')[1]}` },
                { icon: 'location', text: event.location || 'TBD' },
                { icon: 'people', text: `${event.rsvp_count} attending${event.max_attendees ? ` / ${event.max_attendees} max` : ''}` },
              ].map((m, i) => (
                <View key={i} style={styles.metaRow}>
                  <View style={[styles.metaIconWrap, { backgroundColor: theme.accent + '18' }]}>
                    <Ionicons name={m.icon as any} size={16} color={theme.accent} />
                  </View>
                  <Text style={styles.metaText}>{m.text}</Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Friends going */}
          {friends.count > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <View style={styles.friendsSection}>
                <Ionicons name="people-circle" size={20} color={theme.accent} />
                <Text style={styles.friendsText}>
                  {friends.friends.map((f: any) => f.name).join(', ')} {friends.count > 1 ? 'are' : 'is'} going
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Description */}
          {event.description && (
            <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{event.description}</Text>
            </Animated.View>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Attendees ({attendees.length})</Text>
              <View style={styles.attendeeRow}>
                {attendees.slice(0, 8).map((a, i) => (
                  <Animated.View key={a.id} entering={ZoomIn.delay(450 + i * 40).springify()}>
                    <View style={[styles.attendeeAvatar, { backgroundColor: catColor, marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }]}>
                      <Text style={styles.attendeeLetter}>{a.name?.[0]}</Text>
                    </View>
                  </Animated.View>
                ))}
                {attendees.length > 8 && (
                  <View style={[styles.attendeeAvatar, { backgroundColor: theme.surfaceElevated, marginLeft: -8 }]}>
                    <Text style={[styles.attendeeLetter, { color: theme.textSecondary }]}>+{attendees.length - 8}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Gallery */}
          <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Gallery</Text>
              <TouchableOpacity onPress={handleUploadPhoto} disabled={uploading}>
                <View style={[styles.uploadBtn, { borderColor: uploading ? theme.textMuted : theme.accent }]}>
                  <Ionicons name="camera" size={16} color={uploading ? theme.textMuted : theme.accent} />
                </View>
              </TouchableOpacity>
            </View>
            {photos.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontFamily: Fonts.body }}>No photos yet. Be the first to upload!</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                {photos.map(p => (
                  <TouchableOpacity key={p.id} onLongPress={() => event.is_admin ? handleDeletePhoto(p.id) : null} delayLongPress={500}>
                    <Image source={{ uri: p.photo_url }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* Tickets */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <TouchableOpacity style={styles.ticketBtn} onPress={() => router.push(`/event-ticket/${id}` as any)}>
              <Ionicons name="ticket" size={18} color={theme.accent} />
              <Text style={styles.ticketBtnText}>View Tickets</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky RSVP Bar — Frosted glass */}
      <View style={styles.rsvpBar}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.rsvpBorderTop} />
        <View style={styles.rsvpInner}>
          <Bounceable
            style={[styles.rsvpBtn, { backgroundColor: event.user_rsvped ? theme.accent : theme.primary }]}
            onPress={handleRSVP}
          >
            <Ionicons name={event.user_rsvped ? 'heart' : 'heart-outline'} size={20} color={event.user_rsvped ? '#000' : '#FFF'} />
            <Text style={[styles.rsvpBtnText, event.user_rsvped && { color: '#000' }]}>
              {event.user_rsvped ? "I'm Going!" : "RSVP — I'm In"}
            </Text>
          </Bounceable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { width: SCREEN_WIDTH, height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

  glassBtnBg: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Glass.background, borderWidth: 1, borderColor: Glass.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtn: { position: 'absolute', top: 52, left: 16 },
  shareBtn: { position: 'absolute', top: 52, right: 16 },

  content: { padding: Spacing.lg, marginTop: -Spacing.xl },
  categoryBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, marginBottom: Spacing.sm, borderWidth: 1,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: FontSize.xs, fontFamily: Fonts.heading, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: FontSize.xxl, fontFamily: Fonts.heading, color: theme.text, marginBottom: Spacing.sm },

  clubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.xs },
  clubLogo: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  clubName: { fontSize: FontSize.md, fontFamily: Fonts.headingMed, flex: 1 },

  metaCard: {
    padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.md,
    marginBottom: Spacing.md, backgroundColor: 'transparent',
    borderWidth: 0, ...Shadows.card,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  metaText: { fontSize: FontSize.sm, flex: 1, color: theme.text, fontFamily: Fonts.body },

  friendsSection: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.md,
    backgroundColor: theme.accent + '0D', borderWidth: 1, borderColor: theme.accent + '22',
  },
  friendsText: { fontSize: FontSize.sm, fontFamily: Fonts.headingMed, flex: 1, color: theme.accent },

  section: { marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Fonts.heading, marginBottom: Spacing.sm, color: theme.text },
  description: { fontSize: FontSize.md, lineHeight: 24, color: theme.textSecondary, fontFamily: Fonts.body },

  attendeeRow: { flexDirection: 'row', alignItems: 'center' },
  attendeeAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.background },
  attendeeLetter: { color: '#FFF', fontSize: 14, fontFamily: Fonts.headingMed },

  uploadBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  galleryImage: { width: 150, height: 150, borderRadius: BorderRadius.md },

  ticketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Glass.background, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Glass.border,
  },
  ticketBtnText: { fontFamily: Fonts.headingMed, color: theme.accent, fontSize: FontSize.sm },

  rsvpBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Spacing.lg,
    overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  rsvpBorderTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.15)'
  },
  rsvpInner: {
    padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  rsvpBtn: {
    height: 54, borderRadius: BorderRadius.lg, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
    ...Shadows.card,
  },
  rsvpBtnText: { color: '#FFF', fontSize: FontSize.md, fontFamily: Fonts.heading },
});
