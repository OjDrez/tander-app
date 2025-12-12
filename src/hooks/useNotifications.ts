import { useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { matchingApi } from '../api/matchingApi';
import { AppStackParamList } from '../navigation/NavigationTypes';

/**
 * useNotifications Hook
 *
 * Handles notification setup, permissions, and response handling.
 * Should be used in the main app component after authentication.
 */
export function useNotifications() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    const granted = await notificationService.requestPermissions();
    console.log('🔔 Notification permissions:', granted ? 'granted' : 'denied');
    return granted;
  }, []);

  // Schedule expiration reminders for all matches
  const scheduleExpirationReminders = useCallback(async () => {
    try {
      const matches = await matchingApi.getMatchesList();
      await notificationService.scheduleExpirationReminders(matches);
    } catch (error) {
      console.error('❌ Failed to schedule expiration reminders:', error);
    }
  }, []);

  // Handle notification tap
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        type?: string;
        matchId?: number;
        userId?: number;
        conversationId?: number;
        senderId?: number;
      };

      console.log('🔔 Notification tapped:', data);

      switch (data.type) {
        case 'match_expiration':
        case 'match_expiration_urgent':
          // Navigate to matches screen
          navigation.navigate('MyMatchesScreen');
          break;

        case 'new_match':
          if (data.userId) {
            // Navigate to the match's profile
            navigation.navigate('ViewProfileScreen', {
              userId: data.userId.toString(),
            });
          }
          break;

        case 'new_message':
          if (data.conversationId && data.senderId) {
            // Navigate to conversation
            navigation.navigate('ConversationScreen', {
              conversationId: data.conversationId,
              otherUserId: data.senderId,
              otherUserName: 'Message', // Will be updated by screen
            });
          }
          break;

        default:
          // Navigate to inbox for unknown types
          navigation.navigate('InboxScreen');
      }
    },
    [navigation]
  );

  // Setup listeners on mount
  useEffect(() => {
    // Initialize and request permissions
    initializeNotifications();

    // Listen for notifications when app is in foreground
    notificationListener.current = notificationService.addNotificationListener(
      (notification) => {
        console.log('🔔 Notification received:', notification.request.content.title);
        // Could show an in-app toast here
      }
    );

    // Listen for notification taps
    responseListener.current = notificationService.addNotificationResponseListener(
      handleNotificationResponse
    );

    // Schedule expiration reminders
    scheduleExpirationReminders();

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [initializeNotifications, handleNotificationResponse, scheduleExpirationReminders]);

  return {
    initializeNotifications,
    scheduleExpirationReminders,
  };
}

export default useNotifications;
