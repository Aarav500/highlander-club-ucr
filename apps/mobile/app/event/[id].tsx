import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Share, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { events as eventsApi, points as pointsApi } from '../../services/api';
import { getAuthToken } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;
  const [event, setEvent] = useState<any>(null);
  const [friends, setFriends] = useState<any>({ friends: [], count: 0 });
  const [attendees, setAttendees] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const [eventData, friendsData, attendeeData, photosData] = await Promise.all([
        eventsApi.get(id as string),
        eventsApi.friends(id as string),
        eventsApi.attendees(id as string),
        eventsApi.photos(id as string)
      ]);
      setEvent(eventData);
      setFriends(friendsData);
      setAttendees(attendeeData);
      setPhotos(photosData);
    } catch (err) {
      console.error('Event load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    try {
      const result = await eventsApi.rsvp(id as string);
      setEvent((prev: any) => ({ ...prev, user_rsvped: result.rsvped, rsvp_count: String(result.rsvp_count) }));
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('full')) {
        Alert.alert('Event Full', 'This event has reached its maximum capacity.');
      } else {
        console.error('RSVP error:', err.message);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${event.title}" at UCR! 🎉\nhighlanderevents://event/${id}`,
        title: event.title,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const asset = result.assets[0];
        
        // 1. Get presigned URL
        const res = await fetch(`http://localhost:3001/api/upload/presign?contentType=image/jpeg`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        const { uploadUrl, publicUrl } = await res.json();

        // 2. Upload to S3
        const imageRes = await fetch(asset.uri);
        const blob = await imageRes.blob();
        await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });

        // 3. Save to event
        await eventsApi.update(id as string, { photo_url: publicUrl }); // actually we should use eventsApi.addPhoto which we will just make a raw fetch since we need custom URL handling
        await fetch(`http://localhost:3001/api/events/${id}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: publicUrl })
        });
        
        loadEvent(); // Refresh photos
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(`http://localhost:3001/api/events/${id}/photos/${photoId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${getAuthToken()}` }
            });
            loadEvent();
          } catch (e) { console.error('Delete error', e); }
      }}
    ])
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Event not found</Text>
      </View>
    );
  }

  const catColor = Colors.categories[event.category as keyof typeof Colors.categories] || theme.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: catColor + '33' }]}>
              <Ionicons name="calendar" size={80} color={catColor} />
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '22' }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{event.category}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>

          {/* Club */}
          <TouchableOpacity
            style={styles.clubRow}
            onPress={() => router.push(`/club/${event.club_id}` as any)}
          >
            <View style={[styles.clubLogo, { backgroundColor: theme.primary }]}>
              <Ionicons name="people" size={14} color="#FFF" />
            </View>
            <Text style={[styles.clubName, { color: theme.primary }]}>{event.club_name}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Meta info */}
          <View style={[styles.metaCard, { backgroundColor: theme.surface }]}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={18} color={theme.accent} />
              <Text style={[styles.metaText, { color: theme.text }]}>{formatDateTime(event.start_time)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={18} color={theme.accent} />
              <Text style={[styles.metaText, { color: theme.text }]}>Until {formatDateTime(event.end_time).split(' at ')[1]}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={18} color={theme.accent} />
              <Text style={[styles.metaText, { color: theme.text }]}>{event.location || 'TBD'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="people" size={18} color={theme.accent} />
              <Text style={[styles.metaText, { color: theme.text }]}>
                {event.rsvp_count} attending{event.max_attendees ? ` / ${event.max_attendees} max` : ''}
              </Text>
            </View>
          </View>

          {/* Friends going */}
          {friends.count > 0 && (
            <View style={[styles.friendsSection, { backgroundColor: theme.accent + '11' }]}>
              <Ionicons name="people-circle" size={20} color={theme.accent} />
              <Text style={[styles.friendsText, { color: theme.accent }]}>
                {friends.friends.map((f: any) => f.name).join(', ')} {friends.count > 1 ? 'are' : 'is'} going
              </Text>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>{event.description}</Text>
            </View>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Attendees ({attendees.length})
              </Text>
              <View style={styles.attendeeRow}>
                {attendees.slice(0, 8).map((a, i) => (
                  <View key={a.id} style={[styles.attendeeAvatar, { backgroundColor: theme.primary, marginLeft: i > 0 ? -8 : 0 }]}>
                    <Text style={styles.attendeeLetter}>{a.name?.[0]}</Text>
                  </View>
                ))}
                {attendees.length > 8 && (
                  <View style={[styles.attendeeAvatar, { backgroundColor: theme.surfaceElevated, marginLeft: -8 }]}>
                    <Text style={[styles.attendeeLetter, { color: theme.textSecondary }]}>+{attendees.length - 8}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Photo Gallery */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Gallery</Text>
              <TouchableOpacity onPress={handleUploadPhoto} disabled={uploading}>
                <Ionicons name="camera" size={24} color={uploading ? theme.textSecondary : theme.accent} />
              </TouchableOpacity>
            </View>
            
            {photos.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>No photos yet. Be the first to upload!</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                {photos.map(p => (
                  <TouchableOpacity 
                    key={p.id} 
                    onLongPress={() => event.is_admin ? handleDeletePhoto(p.id) : null}
                    delayLongPress={500}
                  >
                    <Image source={{ uri: p.photo_url }} style={{ width: 140, height: 140, borderRadius: BorderRadius.md }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Ticket & Check-in Section */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: theme.surface, paddingVertical: Spacing.md, borderRadius: BorderRadius.md }}
                onPress={() => router.push(`/event-ticket/${id}` as any)}
              >
                <Ionicons name="ticket" size={18} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: FontSize.sm, fontWeight: '600' }}>Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: '#4ADE80' + '22', paddingVertical: Spacing.md, borderRadius: BorderRadius.md }}
                onPress={async () => {
                  try {
                    const result = await pointsApi.checkin(id as string);
                    Alert.alert('🎉 Checked In!', result.message);
                  } catch (err: any) {
                    Alert.alert('Check-in', err.message || 'Cannot check in right now');
                  }
                }}
              >
                <Ionicons name="location" size={18} color="#4ADE80" />
                <Text style={{ color: '#4ADE80', fontSize: FontSize.sm, fontWeight: '600' }}>Check In (+20 pts)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky RSVP Bar */}
      <View style={[styles.rsvpBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.rsvpBtn, { backgroundColor: event.user_rsvped ? theme.accent : theme.primary }]}
          onPress={handleRSVP}
        >
          <Ionicons name={event.user_rsvped ? 'heart' : 'heart-outline'} size={20} color="#FFF" />
          <Text style={styles.rsvpBtnText}>
            {event.user_rsvped ? "I'm Going!" : "RSVP — I'm In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { width: SCREEN_WIDTH, height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,26,0.3)' },
  backBtn: { position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { position: 'absolute', top: 52, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, marginTop: -Spacing.xl },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
  categoryText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.sm },
  clubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.xs },
  clubLogo: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  clubName: { fontSize: FontSize.md, fontWeight: '600', flex: 1 },
  metaCard: { padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.md, marginBottom: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaText: { fontSize: FontSize.sm, flex: 1 },
  friendsSection: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.md },
  friendsText: { fontSize: FontSize.sm, fontWeight: '600', flex: 1 },
  section: { marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  description: { fontSize: FontSize.md, lineHeight: 24 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center' },
  attendeeAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark.background },
  attendeeLetter: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rsvpBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, borderTopWidth: 1 },
  rsvpBtn: { height: 52, borderRadius: BorderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  rsvpBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
});
