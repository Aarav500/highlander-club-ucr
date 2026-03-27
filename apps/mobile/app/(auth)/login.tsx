import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { auth, setAuthToken } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email.endsWith('@ucr.edu')) {
      setError('Please use your @ucr.edu email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use dev-login for direct authentication (testing mode)
      const result = await auth.devLogin(email);
      if (result.token) {
        await AsyncStorage.setItem('auth_token', result.token);
        setAuthToken(result.token);
        router.replace('/(tabs)' as any);
      } else {
        // Fallback to verification code flow
        await auth.login(email);
        setStep('code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await auth.verify(email, code);
      await AsyncStorage.setItem('auth_token', result.token);
      setAuthToken(result.token);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="flame" size={48} color={theme.accent} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Highlander Events</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Never miss a UCR event again.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Sign in with your UCR email</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border }]}>
                <Ionicons name="mail" size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="yourname@ucr.edu"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ color: theme.accent }}>{email}</Text>
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border }]}>
                <Ionicons name="keypad" size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text, letterSpacing: 8, fontSize: 24 }]}
                  placeholder="000000"
                  placeholderTextColor={theme.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify & Sign In</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError(''); }}>
                <Text style={[styles.backLink, { color: theme.primary }]}>← Back to email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.textMuted }]}>
          Only UCR students with a valid @ucr.edu email can sign in.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  appName: { fontSize: FontSize.hero, fontWeight: '800' },
  tagline: { fontSize: FontSize.md, marginTop: Spacing.xs },
  form: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.md, marginBottom: Spacing.md, textAlign: 'center', lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, height: 56, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm, marginBottom: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md },
  button: { height: 56, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  buttonText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
  errorText: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  backLink: { textAlign: 'center', marginTop: Spacing.md, fontSize: FontSize.md },
  footer: { textAlign: 'center', fontSize: FontSize.xs },
});
