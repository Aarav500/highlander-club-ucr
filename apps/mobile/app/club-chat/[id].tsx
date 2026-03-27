import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { chat as chatApi, clubs as clubsApi } from '../../services/api';

export default function ClubChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = Colors.dark;
  const [messages, setMessages] = useState<any[]>([]);
  const [club, setClub] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadInitial();
    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  const loadInitial = async () => {
    try {
      const [clubData, msgs] = await Promise.all([
        clubsApi.get(id as string),
        chatApi.messages(id as string),
      ]);
      setClub(clubData);
      setMessages(msgs);
    } catch (err) {
      console.error('Chat load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await chatApi.messages(id as string);
      setMessages(msgs);
    } catch (err) { /* silent poll failure */ }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await chatApi.send(id as string, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    Alert.alert('Delete Message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await chatApi.deleteMessage(id as string, msgId);
          setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (err) { console.error('Delete error:', err); }
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{club?.name || 'Club Chat'}</Text>
          <Text style={styles.headerSub}>{messages.length} messages</Text>
        </View>
        <View style={styles.headerDot}>
          <View style={[styles.onlineDot, { backgroundColor: '#4ADE80' }]} />
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageBubble}
            onLongPress={() => handleDeleteMessage(item.id)}
            delayLongPress={800}
            activeOpacity={0.8}
          >
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>
                {item.user_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>{item.user_name}</Text>
                <Text style={styles.messageTime}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={56} color={theme.textMuted} />
            <Text style={styles.emptyChatTitle}>No messages yet</Text>
            <Text style={styles.emptyChatSub}>Be the first to say something!</Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={theme.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: 56, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '700' },
  headerSub: { color: Colors.dark.textSecondary, fontSize: FontSize.xs },
  headerDot: { width: 40, alignItems: 'center' },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },

  messageList: { padding: Spacing.md, paddingBottom: Spacing.xl },
  messageBubble: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  messageAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center',
  },
  messageAvatarText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },
  messageContent: {
    flex: 1, backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md, borderTopLeftRadius: 4,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  messageName: { color: Colors.dark.primary, fontSize: FontSize.xs, fontWeight: '700' },
  messageTime: { color: Colors.dark.textMuted, fontSize: 10 },
  messageText: { color: Colors.dark.text, fontSize: FontSize.sm, lineHeight: 20 },

  emptyChat: { alignItems: 'center', marginTop: 120 },
  emptyChatTitle: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: '600', marginTop: Spacing.md },
  emptyChatSub: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface, borderTopWidth: 1, borderTopColor: Colors.dark.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.sm,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, color: Colors.dark.text,
    fontSize: FontSize.sm, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
