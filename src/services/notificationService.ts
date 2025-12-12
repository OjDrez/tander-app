import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Match } from '../types/matching';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification Service
 *
 * Handles local push notifications for:
 * - Match expiration reminders
 * - New message alerts
 * - Match celebration
 */
class NotificationService {
  private hasPermission = false;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';

      if (this.hasPermission && Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      console.log('✅ Notification permissions:', this.hasPermission ? 'granted' : 'denied');
      return this.hasPermission;
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'Matches',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  /**
   * Schedule match expiration reminder
   * Schedules a notification for when a match is about to expire
   */
  async scheduleMatchExpirationReminder(match: Match): Promise<string | null> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }

    if (!this.hasPermission || match.chatStarted) {
      return null;
    }

    try {
      // Cancel any existing reminder for this match
      await this.cancelMatchReminder(match.id);

      // Calculate when to send reminder (24 hours before expiration)
      const hoursUntilExpiration = match.hoursUntilExpiration || 0;

      // Only schedule if more than 24 hours left
      if (hoursUntilExpiration <= 24) {
        // Already expiring soon - send immediate reminder
        return await this.sendExpirationWarning(match);
      }

      // Schedule for 24 hours before expiration
      const hoursUntilReminder = hoursUntilExpiration - 24;
      const secondsUntilReminder = hoursUntilReminder * 60 * 60;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Match Expiring Soon!',
          body: `Your match with ${match.matchedUserDisplayName} expires in 24 hours. Start a conversation now!`,
          data: {
            type: 'match_expiration',
            matchId: match.id,
            userId: match.matchedUserId,
          },
          sound: 'default',
        },
        trigger: {
          seconds: secondsUntilReminder,
          channelId: 'reminders',
        },
      });

      console.log(`📅 Scheduled expiration reminder for match ${match.id} in ${hoursUntilReminder} hours`);
      return identifier;
    } catch (error) {
      console.error('❌ Failed to schedule expiration reminder:', error);
      return null;
    }
  }

  /**
   * Send immediate expiration warning
   */
  async sendExpirationWarning(match: Match): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      const hours = match.hoursUntilExpiration || 0;
      const timeText = hours < 1 ? 'less than an hour' : `${Math.ceil(hours)} hours`;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Match Expiring!',
          body: `Your match with ${match.matchedUserDisplayName} expires in ${timeText}. Say hello before it's too late!`,
          data: {
            type: 'match_expiration_urgent',
            matchId: match.id,
            userId: match.matchedUserId,
          },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      return identifier;
    } catch (error) {
      console.error('❌ Failed to send expiration warning:', error);
      return null;
    }
  }

  /**
   * Cancel match reminder
   */
  async cancelMatchReminder(matchId: number): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as { matchId?: number } | undefined;
        if (data?.matchId === matchId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('❌ Failed to cancel match reminder:', error);
    }
  }

  /**
   * Send new match celebration notification
   */
  async sendMatchCelebration(
    matchedUserName: string,
    matchedUserId: number
  ): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 It's a Match!",
          body: `You and ${matchedUserName} have liked each other! Start a conversation now.`,
          data: {
            type: 'new_match',
            userId: matchedUserId,
          },
          sound: 'default',
        },
        trigger: null,
      });

      return identifier;
    } catch (error) {
      console.error('❌ Failed to send match celebration:', error);
      return null;
    }
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    senderName: string,
    messagePreview: string,
    conversationId: number,
    senderId: number
  ): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      // Truncate message preview
      const preview = messagePreview.length > 100
        ? messagePreview.substring(0, 97) + '...'
        : messagePreview;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: senderName,
          body: preview,
          data: {
            type: 'new_message',
            conversationId,
            senderId,
          },
          sound: 'default',
        },
        trigger: null,
      });

      return identifier;
    } catch (error) {
      console.error('❌ Failed to send message notification:', error);
      return null;
    }
  }

  /**
   * Schedule reminders for all expiring matches
   */
  async scheduleExpirationReminders(matches: Match[]): Promise<void> {
    // Filter to matches that need reminders
    const needsReminder = matches.filter(
      (m) =>
        m.status === 'ACTIVE' &&
        !m.chatStarted &&
        m.hoursUntilExpiration !== undefined
    );

    for (const match of needsReminder) {
      await this.scheduleMatchExpirationReminder(match);
    }

    console.log(`📅 Scheduled ${needsReminder.length} expiration reminders`);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get notification response listener
   * Call this in app setup to handle notification taps
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get notification listener (for foreground notifications)
   */
  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
