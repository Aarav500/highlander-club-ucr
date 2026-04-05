import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notifications';

SplashScreen.preventAutoHideAsync();

const UniPulseDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#2D6CC0',
    background: '#0A0E1A',
    card: '#141828',
    text: '#FFFFFF',
    border: '#262C42',
    notification: '#F1AB00',
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({});
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          setAuthToken(token);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.warn('Auth check failed:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  // Push notifications setup
  useEffect(() => {
    if (!isReady || !isLoggedIn) return;

    registerForPushNotifications();
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, [isReady, isLoggedIn]);

  // Deep link handling — unipulse://event/:id
  useEffect(() => {
    if (!isReady) return;

    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      if (parsed.hostname === 'event' && parsed.path) {
        router.push(`/event/${parsed.path}` as any);
      }
    };

    // Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [isReady]);

  useEffect(() => {
    if (loaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <ThemeProvider value={UniPulseDark}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="club/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="club-dashboard/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="admin-panel/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="club-chat/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="event-ticket/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="create-event" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="create-club" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
