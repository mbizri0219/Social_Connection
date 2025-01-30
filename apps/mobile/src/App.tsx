import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SWRConfig } from 'swr';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { notificationService } from './services/notificationService';

export default function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    notificationService.registerForPushNotifications();

    // Listen for incoming notifications while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const result = await notificationService.handleNotificationResponse(response);
      if (result?.type === 'mention') {
        // Navigate to the specific draft and comment
        // This will be handled by the navigation ref
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SWRConfig
          value={{
            fetcher: (url: string) =>
              fetch(url).then((res) => res.json()),
          }}
        >
          <AppNavigator />
        </SWRConfig>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 