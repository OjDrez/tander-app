import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';
import { Match } from '../types/matching';

// Configure notification behavior - optimized for seniors
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Notification Service - Senior Friendly Edition
 *
 * Handles local push notifications with:
 * - Clear, simple language for seniors (60+)
 * - Larger text in notification titles
 * - Gentle but noticeable alerts
 * - Match expiration reminders
 * - New message alerts
 * - Match celebration
 * - Daily activity reminders
 * - Encouraging prompts
 */

// Notification types for tracking
export type NotificationType =
  | 'new_match'
  | 'match_expiration'
  | 'match_expiration_urgent'
  | 'new_message'
  | 'someone_liked_you'
  | 'daily_reminder'
  | 'encouragement'
  | 'connection_reminder';

export interface NotificationData {
  type: NotificationType;
  matchId?: number;
  userId?: number;
  conversationId?: number;
  senderId?: number;
  actionUrl?: string;
}

class NotificationService {
  private hasPermission = false;
  private dailyReminderScheduled = false;

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
   * Setup Android notification channels - Senior Optimized
   * Using longer vibration patterns and higher importance for visibility
   */
  private async setupAndroidChannel(): Promise<void> {
    // Matches channel - high priority for new matches
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'New Matches',
      description: 'Notifications when you match with someone',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400], // Longer, clearer vibration for seniors
      lightColor: '#FF6B6B',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Messages channel - high priority for new messages
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Notifications for new messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: '#4ECDC4',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Reminders channel - for match expirations and activity
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      description: 'Reminders about expiring matches and daily activity',
      importance: Notifications.AndroidImportance.HIGH, // Elevated for seniors
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FFA500',
      sound: 'default',
      enableVibrate: true,
    });

    // Encouragement channel - gentle prompts
    await Notifications.setNotificationChannelAsync('encouragement', {
      name: 'Encouragement',
      description: 'Friendly reminders and tips',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Urgent channel - for time-sensitive notifications
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Urgent',
      description: 'Time-sensitive notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#FF0000',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
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

  // ==================== SENIOR-FRIENDLY NOTIFICATIONS ====================

  /**
   * Send "Someone Liked You" notification
   * Encouraging notification that someone is interested
   */
  async sendSomeoneLikedYou(): Promise<string | null> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }
    if (!this.hasPermission) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Someone is Interested!',
          body: 'Good news! Someone liked your profile. Keep browsing to find them!',
          data: {
            type: 'someone_liked_you' as NotificationType,
          },
          sound: 'default',
        },
        trigger: null,
      });

      // Gentle vibration for positive feedback
      Vibration.vibrate([0, 200, 100, 200]);

      return identifier;
    } catch (error) {
      console.error('Failed to send liked notification:', error);
      return null;
    }
  }

  /**
   * Send Daily Activity Reminder
   * Gentle prompt to encourage daily engagement
   */
  async scheduleDailyReminder(hour: number = 10, minute: number = 0): Promise<string | null> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }
    if (!this.hasPermission || this.dailyReminderScheduled) return null;

    try {
      // Cancel any existing daily reminder
      await this.cancelDailyReminder();

      const encouragingMessages = [
        "Good morning! New people are waiting to meet you.",
        "Today could be the day you find a new friend!",
        "Someone special might be browsing right now.",
        "Your matches are waiting! Say hello today.",
        "Take a moment to browse some new profiles today.",
      ];

      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good Morning!',
          body: randomMessage,
          data: {
            type: 'daily_reminder' as NotificationType,
          },
          sound: 'default',
        },
        trigger: {
          hour,
          minute,
          repeats: true,
          channelId: 'encouragement',
        },
      });

      this.dailyReminderScheduled = true;
      console.log('Scheduled daily reminder at', hour + ':' + minute);
      return identifier;
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
      return null;
    }
  }

  /**
   * Cancel daily reminder
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as NotificationData | undefined;
        if (data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      this.dailyReminderScheduled = false;
    } catch (error) {
      console.error('Failed to cancel daily reminder:', error);
    }
  }

  /**
   * Send Connection Reminder
   * Remind user to start conversation with a specific match
   */
  async sendConnectionReminder(
    matchedUserName: string,
    matchedUserId: number,
    matchId: number
  ): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to Say Hello!',
          body: `${matchedUserName} is waiting to hear from you. Don't be shy - send a friendly message!`,
          data: {
            type: 'connection_reminder' as NotificationType,
            matchId,
            userId: matchedUserId,
          },
          sound: 'default',
        },
        trigger: null,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to send connection reminder:', error);
      return null;
    }
  }

  /**
   * Send Encouragement Notification
   * Positive reinforcement for user activity
   */
  async sendEncouragement(
    message: string,
    title: string = 'Keep Going!'
  ): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: {
            type: 'encouragement' as NotificationType,
          },
          sound: 'default',
        },
        trigger: null,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to send encouragement:', error);
      return null;
    }
  }

  /**
   * Send Urgent Match Expiration (uses urgent channel)
   * For matches expiring in < 2 hours
   */
  async sendUrgentMatchExpiration(
    matchedUserName: string,
    matchedUserId: number,
    matchId: number,
    minutesRemaining: number
  ): Promise<string | null> {
    if (!this.hasPermission) return null;

    try {
      const timeText = minutesRemaining < 60
        ? `${minutesRemaining} minutes`
        : `${Math.ceil(minutesRemaining / 60)} hour${Math.ceil(minutesRemaining / 60) > 1 ? 's' : ''}`;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'URGENT: Match Expiring!',
          body: `Only ${timeText} left to connect with ${matchedUserName}! Tap here to send a message now.`,
          data: {
            type: 'match_expiration_urgent' as NotificationType,
            matchId,
            userId: matchedUserId,
          },
          sound: 'default',
        },
        trigger: {
          channelId: 'urgent',
        },
      });

      // Strong vibration for urgency
      Vibration.vibrate([0, 500, 200, 500]);

      return identifier;
    } catch (error) {
      console.error('Failed to send urgent expiration:', error);
      return null;
    }
  }

  /**
   * Send Real-Time Match Notification
   * Called when a match is created via Socket.IO
   */
  async sendRealTimeMatch(
    matchedUserName: string,
    matchedUserId: number,
    matchId: number,
    matchedUserPhoto?: string
  ): Promise<string | null> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }
    if (!this.hasPermission) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "It's a Match!",
          body: `Great news! You and ${matchedUserName} both liked each other. Start a conversation now!`,
          data: {
            type: 'new_match' as NotificationType,
            matchId,
            userId: matchedUserId,
          },
          sound: 'default',
        },
        trigger: {
          channelId: 'matches',
        },
      });

      // Celebratory vibration pattern
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);

      return identifier;
    } catch (error) {
      console.error('Failed to send real-time match notification:', error);
      return null;
    }
  }

  /**
   * Get badge count (for app icon)
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Increment badge count
   */
  async incrementBadge(): Promise<void> {
    const current = await this.getBadgeCount();
    await this.setBadgeCount(current + 1);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get all scheduled notifications count
   */
  async getScheduledCount(): Promise<number> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
