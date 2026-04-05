import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors';
import { clubs as clubsApi, upload as uploadApi } from '../services/api';

const CATEGORIES = ['Academic', 'Social', 'Sports', 'Career', 'Cultural', 'Greek Life'];

export default function CreateClubScreen() {
  const router = useRouter();
  const theme = Colors.dark;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [instagram, setInstagram] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const { uploadUrl, publicUrl } = await uploadApi.getPresignedUrl('image/jpeg');
      const blob = await fetch(asset.uri).then(r => r.blob());
      await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      setLogoUrl(publicUrl);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload logo. Try a smaller image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Club name is required'); return; }
    if (!category) { setError('Category is required'); return; }

    setSubmitting(true);
    try {
      const club = await clubsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        instagram: instagram.trim() || undefined,
        logo_url: logoUrl || undefined,
      });
      Alert.alert(
        'Club Created!',
        `"${club.name}" is live. You're the president — go to the admin panel to post events and invite staff.`,
        [{ text: 'Go to Dashboard', onPress: () => router.replace(`/admin-panel/${club.id}` as any) }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to create club. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Club</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Logo picker */}
        <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo} disabled={uploadingLogo}>
          {uploadingLogo ? (
            <ActivityIndicator color={theme.accent} />
          ) : logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
          ) : (
            <>
              <Ionicons name="camera" size={28} color={theme.textMuted} />
              <Text style={styles.logoPickerText}>Add Club Logo</Text>
              <Text style={styles.logoPickerSub}>Optional · square image works best</Text>
            </>
          )}
          {logoUrl && (
            <View style={styles.logoEditBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          {/* Name */}
          <Text style={styles.label}>Club Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. UCR Engineering Society"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={80}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="What is your club about?"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instagram */}
          <Text style={styles.label}>Instagram Handle</Text>
          <View style={styles.instagramRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={[styles.input, styles.instagramInput]}
              placeholder="yourclub"
              placeholderTextColor={theme.textMuted}
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={theme.primary} />
            <Text style={styles.infoText}>
              You will be set as the <Text style={{ fontWeight: '700', color: theme.text }}>president</Text> of this club.
              After creating it, use the admin panel to post events and invite officers.
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitBtnText}>Create Club</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },

  logoPicker: {
    alignSelf: 'center', width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dark.border, borderStyle: 'dashed',
    marginVertical: Spacing.lg, position: 'relative',
  },
  logoPreview: { width: 100, height: 100, borderRadius: 50 },
  logoPickerText: { color: Colors.dark.textSecondary, fontSize: FontSize.xs, marginTop: 4, fontWeight: '600' },
  logoPickerSub: { color: Colors.dark.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center', paddingHorizontal: 8 },
  logoEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.dark.accent,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark.background,
  },

  form: { paddingHorizontal: Spacing.md },

  label: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6, marginTop: Spacing.md },

  input: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.dark.border, color: Colors.dark.text, fontSize: FontSize.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: Spacing.sm },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  categoryChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  categoryChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  categoryChipText: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },
  categoryChipTextActive: { color: '#FFF', fontWeight: '700' },

  instagramRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  atSign: { color: Colors.dark.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  instagramInput: { flex: 1 },

  infoBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.dark.primary + '18', borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.lg,
  },
  infoText: { flex: 1, color: Colors.dark.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  errorText: { color: '#FF4444', fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: 'center' },

  submitBtn: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  submitBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
});
