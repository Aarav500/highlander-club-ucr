import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { highlanderLink } from '../services/api';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notifications';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

const HighlanderDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#1E6AFF',
    background: '#050810',
    card: '#0D1221',
    text: '#FFFFFF',
    border: '#1A2240',
    notification: '#FFB800',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const loggedIn = !!data.session;
      setIsLoggedIn(loggedIn);
      setIsReady(true);
      if (!redirected.current) {
        redirected.current = true;
        if (loggedIn) router.replace('/(tabs)' as any);
        else router.replace('/(auth)/login' as any);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (event === 'SIGNED_IN' && session) router.replace('/(tabs)' as any);
      if (event === 'SIGNED_OUT') router.replace('/(auth)/login' as any);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Push notifications + background club sync
  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    registerForPushNotifications();
    const cleanup = setupNotificationListeners();
    // Sync all Highlander Link clubs into Supabase in background
    highlanderLink.syncToSupabase();
    return cleanup;
  }, [isReady, isLoggedIn]);

  // Deep link handling — highlanderevents://event/:id
  useEffect(() => {
    if (!isReady) return;
    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      if (parsed.hostname === 'event' && parsed.path) {
        router.push(`/event/${parsed.path}` as any);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [isReady]);

  useEffect(() => {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) return null;

  return (
    <ThemeProvider value={HighlanderDark}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
          contentStyle: { backgroundColor: '#050810' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="club/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="club-dashboard/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="club-chat/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="event-ticket/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="create-event"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="create-club"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 350,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
