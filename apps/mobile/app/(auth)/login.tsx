import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';
import { auth, setAuthToken } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Email-code fallback state
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  // Handle deep link callback from CAS
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('auth/callback')) {
        // Extract token from URL
        const params = new URLSearchParams(url.split('?')[1] || '');
        const token = params.get('token');
        if (token) {
          await AsyncStorage.setItem('auth_token', token);
          setAuthToken(token);
          router.replace('/(tabs)' as any);
        }
      }
    };

    // Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // ─── CAS SSO Login ─────────────────────────────────────────────────────────
  const handleCASLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const casUrl = auth.getCASLoginUrl('mobile');
      const supported = await Linking.canOpenURL(casUrl);
      if (supported) {
        await Linking.openURL(casUrl);
      } else {
        setError('Cannot open UCR login page');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open UCR login');
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Code Fallback ───────────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!email.endsWith('@ucr.edu')) {
      setError('Please use your @ucr.edu email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await auth.login(email);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
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

        {!showEmailFallback ? (
          /* ─── Primary: CAS SSO Login ─────────────────────────────────── */
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Sign in with your UCR credentials
            </Text>

            {/* CAS SSO Button */}
            <TouchableOpacity
              style={[styles.casButton, { opacity: loading ? 0.6 : 1 }]}
              onPress={handleCASLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.casButtonInner}>
                <View style={styles.casIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                </View>
                <View style={styles.casButtonText}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.casTitle}>Sign in with UCR</Text>
                      <Text style={styles.casSubtitle}>UCR NetID + Duo MFA</Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>

            {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}

            {/* SSO Info */}
            <View style={styles.ssoInfo}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.ssoInfoText, { color: theme.textMuted }]}>
                Uses UCR's secure Central Authentication Service — same as Canvas, R'Web, and iLearn.
              </Text>
            </View>

            {/* Email fallback toggle */}
            <TouchableOpacity
              style={styles.fallbackToggle}
              onPress={() => setShowEmailFallback(true)}
            >
              <Text style={[styles.fallbackText, { color: theme.textMuted }]}>
                Having trouble? Use email verification instead
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── Fallback: Email Code ───────────────────────────────────── */
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
            {/* Back to CAS */}
            <TouchableOpacity
              style={styles.fallbackToggle}
              onPress={() => { setShowEmailFallback(false); setError(''); }}
            >
              <Text style={[styles.fallbackText, { color: theme.primary }]}>← Back to UCR SSO login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.textMuted }]}>
          Only UCR students with a valid @ucr.edu credential can sign in.
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

  // CAS SSO Button
  casButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: '#003A70', // UCR Navy Blue
  },
  casButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  casIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  casButtonText: {
    flex: 1,
  },
  casTitle: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  casSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginTop: 2,
  },

  // SSO Info
  ssoInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  ssoInfoText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  // Fallback toggle
  fallbackToggle: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: FontSize.sm,
  },

  // Email-code fallback styles
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, height: 56, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm, marginBottom: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md },
  button: { height: 56, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  buttonText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
  errorText: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  backLink: { textAlign: 'center', marginTop: Spacing.md, fontSize: FontSize.md },
  footer: { textAlign: 'center', fontSize: FontSize.xs },
});
