import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  Linking, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withRepeat, withSequence, interpolate, Easing,
  FadeIn, FadeInDown, ZoomIn,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Glass, Shadows, Gradients } from '../../constants/Colors';
import { useFloating, useSpringPress, useGlowPulse } from '../../constants/animations';
import { auth, setAuthToken } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const theme = Colors.dark;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Enhanced Glow Orb ───────────────────────────────────────────────────────
function GlowOrb({ x, y, color, size, delay }: { x: number; y: number; color: string; size: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 + delay, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000 + delay, easing: Easing.inOut(Easing.sin) })
        ), -1, false
      )
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.15, 0.4, 0.15]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -30]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.85, 1.15, 0.85]) },
    ],
  }));

  return (
    <Animated.View
      style={[styles.orb, { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, orbStyle]}
    />
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  const floatingStyle = useFloating({ amplitude: 6, duration: 4000 });
  const logoGlowStyle = useGlowPulse({ minScale: 0.95, maxScale: 1.05, duration: 3000 });
  const { animatedStyle: casBtnPress, onPressIn, onPressOut } = useSpringPress({ scaleTo: 0.97 });

  // Form transition
  const formOpacity = useSharedValue(1);

  // Entrance
  const contentY = useSharedValue(60);
  const contentOpacity = useSharedValue(0);
  useEffect(() => {
    contentY.value = withSpring(0, { damping: 14, stiffness: 80 });
    contentOpacity.value = withTiming(1, { duration: 600 });
  }, []);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({ opacity: formOpacity.value }));

  const switchToFallback = () => {
    formOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setShowEmailFallback(true);
      formOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  const switchToCAS = () => {
    formOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setShowEmailFallback(false); setError('');
      formOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('auth/callback')) {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const token = params.get('token');
        if (token) {
          await AsyncStorage.setItem('auth_token', token);
          setAuthToken(token);
          router.replace('/(tabs)' as any);
        }
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleCASLogin = async () => {
    setLoading(true); setError('');
    try {
      const casUrl = auth.getCASLoginUrl('mobile');
      const supported = await Linking.canOpenURL(casUrl);
      if (supported) await Linking.openURL(casUrl);
      else setError('Cannot open UCR login page');
    } catch (err: any) { setError(err.message || 'Failed to open UCR login'); }
    finally { setLoading(false); }
  };

  const handleSendCode = async () => {
    if (!email.endsWith('@ucr.edu')) { setError('Please use your @ucr.edu email'); return; }
    setLoading(true); setError('');
    try { await auth.login(email); setStep('code'); }
    catch (err: any) { setError(err.message || 'Failed to send code'); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const result = await auth.verify(email, code);
      await AsyncStorage.setItem('auth_token', result.token);
      setAuthToken(result.token);
      router.replace('/(tabs)' as any);
    } catch (err: any) { setError(err.message || 'Invalid code'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050810', '#080F20', '#050810']} style={StyleSheet.absoluteFill} />

      {/* Ambient orbs */}
      <GlowOrb x={-80} y={SCREEN_HEIGHT * 0.1} color={theme.primary} size={300} delay={0} />
      <GlowOrb x={SCREEN_WIDTH * 0.6} y={SCREEN_HEIGHT * 0.35} color={theme.cyan} size={200} delay={500} />
      <GlowOrb x={SCREEN_WIDTH * 0.1} y={SCREEN_HEIGHT * 0.65} color={theme.accent} size={160} delay={1000} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.content, contentStyle]}>

          {/* Hero — floating logo */}
          <View style={styles.hero}>
            <Animated.View style={[styles.logoOuter, floatingStyle]}>
              <Animated.View style={[styles.logoGlowRing, logoGlowStyle]} />
              <View style={styles.logoRing}>
                <LinearGradient colors={[theme.primary, theme.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
                  <Ionicons name="flame" size={36} color="#FFF" />
                </LinearGradient>
              </View>
            </Animated.View>
            <Text style={styles.appName}>Highlander{'\n'}Events</Text>
            <Text style={styles.tagline}>UCR campus life, all in one place.</Text>
          </View>

          {/* Card — glassmorphism */}
          <View style={styles.card}>
            <Animated.View style={formStyle}>
              {!showEmailFallback ? (
                <View>
                  <Text style={styles.cardTitle}>Sign in with UCR</Text>
                  <Text style={styles.cardSubtitle}>Use your UCR NetID and Duo MFA — the same as Canvas and iLearn.</Text>

                  <AnimatedTouchable
                    style={[styles.casBtn, { opacity: loading ? 0.7 : 1 }, casBtnPress]}
                    onPress={handleCASLogin}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading}
                    activeOpacity={1}
                  >
                    <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.casBtnInner}>
                      <View style={styles.casBtnIcon}>
                        <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                      </View>
                      {loading ? (
                        <ActivityIndicator color="#FFF" style={{ flex: 1 }} />
                      ) : (
                        <View style={{ flex: 1 }}>
                          <Text style={styles.casBtnText}>Continue with UCR SSO</Text>
                          <Text style={styles.casBtnSub}>NetID + Duo MFA</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
                    </LinearGradient>
                  </AnimatedTouchable>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity style={styles.fallbackLink} onPress={switchToFallback}>
                    <Text style={styles.fallbackLinkText}>Having trouble? Try email code instead</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.cardTitle}>{step === 'email' ? 'Email Verification' : 'Enter Code'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {step === 'email' ? "We'll send a 6-digit code to your UCR email." : `Code sent to ${email}`}
                  </Text>

                  {step === 'email' ? (
                    <>
                      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
                        <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                        <TextInput style={styles.input} placeholder="yourname@ucr.edu" placeholderTextColor={theme.textMuted}
                          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus />
                      </View>
                      {error ? <Text style={styles.errorText}>{error}</Text> : null}
                      <TouchableOpacity style={[styles.actionBtn, { opacity: loading ? 0.7 : 1 }]} onPress={handleSendCode} disabled={loading}>
                        <LinearGradient colors={Gradients.primary} style={styles.actionBtnGrad}>
                          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Send Code</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
                        <Ionicons name="keypad-outline" size={18} color={theme.textMuted} />
                        <TextInput style={[styles.input, { letterSpacing: 10, fontSize: 22, fontWeight: '700' }]}
                          placeholder="000000" placeholderTextColor={theme.textMuted}
                          value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoFocus />
                      </View>
                      {error ? <Text style={styles.errorText}>{error}</Text> : null}
                      <TouchableOpacity style={[styles.actionBtn, { opacity: loading ? 0.7 : 1 }]} onPress={handleVerify} disabled={loading}>
                        <LinearGradient colors={Gradients.primary} style={styles.actionBtnGrad}>
                          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Verify & Sign In</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError(''); }}>
                        <Text style={[styles.fallbackLinkText, { color: theme.primary, marginTop: 12, textAlign: 'center' }]}>← Change email</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity style={styles.fallbackLink} onPress={switchToCAS}>
                    <Text style={[styles.fallbackLinkText, { color: theme.primary }]}>← Back to UCR SSO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>

          <Text style={styles.footer}>Only students with a valid @ucr.edu credential can sign in.</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  orb: { position: 'absolute', filter: 'blur(80px)' as any },

  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  logoOuter: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, position: 'relative' },
  logoGlowRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 40,
    backgroundColor: theme.primary + '20',
  },
  logoRing: {
    width: 80, height: 80, borderRadius: 24, overflow: 'hidden',
    ...Shadows.glow(theme.primary),
  },
  logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appName: { fontFamily: Fonts.heading, fontSize: FontSize.xxxl, color: theme.text, textAlign: 'center', lineHeight: 40, marginBottom: Spacing.xs },
  tagline: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: theme.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Glass.backgroundStrong, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Glass.border,
    marginBottom: Spacing.lg, ...Shadows.elevated,
  },
  cardTitle: { fontFamily: Fonts.heading, fontSize: FontSize.xl, color: theme.text, marginBottom: Spacing.xs },
  cardSubtitle: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: theme.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },

  casBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadows.glow(theme.primary) },
  casBtnInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  casBtnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  casBtnText: { fontFamily: Fonts.headingMed, fontSize: FontSize.md, color: '#FFF' },
  casBtnSub: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  actionBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.sm, ...Shadows.glow(theme.primary) },
  actionBtnGrad: { height: 52, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontFamily: Fonts.headingMed, fontSize: FontSize.md, color: '#FFF' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceElevated,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 52,
    borderWidth: 1, borderColor: Glass.border, gap: Spacing.sm, marginBottom: Spacing.xs,
  },
  inputWrapError: { borderColor: theme.danger },
  input: { flex: 1, color: theme.text, fontSize: FontSize.md, fontFamily: Fonts.body },

  errorText: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: theme.danger, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  fallbackLink: { marginTop: Spacing.md, alignItems: 'center' },
  fallbackLinkText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: theme.textMuted },
  footer: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: theme.textMuted, textAlign: 'center' },
});
