import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { notifications as notificationsApi } from './api';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D6CC0',
    });
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Register with backend
    try {
      await notificationsApi.register(pushToken);
    } catch (err) {
      console.warn('Failed to register push token with backend:', err);
    }

    return pushToken;
  } catch (err) {
    console.warn('Failed to get push token:', err);
    return null;
  }
}

export function setupNotificationListeners() {
  // Handle notification tap — navigate to event detail via deep link
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.event_id) {
      router.push(`/event/${data.event_id}` as any);
    }
  });

  return () => {
    responseSubscription.remove();
  };
}
