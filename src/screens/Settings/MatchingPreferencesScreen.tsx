import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import colors from '@/src/config/colors';
import { notificationService } from '@/src/services/notificationService';
import { useToast } from '@/src/context/ToastContext';

/**
 * MatchingPreferencesScreen - Senior Friendly Edition
 *
 * Simple, clear preferences for matching:
 * - Age range preferences
 * - Location preferences
 * - Notification settings
 * - Daily reminder settings
 *
 * Designed for users 60+ with:
 * - Large touch targets
 * - Clear labels
 * - Simple options
 * - Helpful descriptions
 */

interface MatchingPreferences {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  showOnlineOnly: boolean;
  showVerifiedOnly: boolean;
  enableMatchNotifications: boolean;
  enableMessageNotifications: boolean;
  enableDailyReminder: boolean;
  dailyReminderHour: number;
}

const DEFAULT_PREFERENCES: MatchingPreferences = {
  minAge: 55,
  maxAge: 80,
  maxDistance: 50,
  showOnlineOnly: false,
  showVerifiedOnly: false,
  enableMatchNotifications: true,
  enableMessageNotifications: true,
  enableDailyReminder: true,
  dailyReminderHour: 10,
};

export default function MatchingPreferencesScreen() {
  const navigation = useNavigation();
  const [preferences, setPreferences] = useState<MatchingPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences
  useEffect(() => {
    // TODO: Load from AsyncStorage or API
    // For now, use defaults
  }, []);

  // Update preference helper
  const updatePreference = useCallback(<K extends keyof MatchingPreferences>(
    key: K,
    value: MatchingPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const toast = useToast();

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to AsyncStorage and/or API

      // Handle daily reminder scheduling
      if (preferences.enableDailyReminder) {
        await notificationService.scheduleDailyReminder(preferences.dailyReminderHour, 0);
      } else {
        await notificationService.cancelDailyReminder();
      }

      setHasChanges(false);
      toast.success('Your preferences have been updated.');
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render section header
  const renderSectionHeader = (title: string, description: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon as any} size={28} color={colors.accentTeal} />
        <AppText size="h3" weight="bold" color={colors.textPrimary}>
          {title}
        </AppText>
      </View>
      <AppText size="body" color={colors.textSecondary} style={styles.sectionDescription}>
        {description}
      </AppText>
    </View>
  );

  // Render toggle option
  const renderToggle = (
    label: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleContent}>
        <AppText size="h4" weight="semibold" color={colors.textPrimary}>
          {label}
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.toggleDescription}>
          {description}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderLight, true: colors.accentTeal }}
        thumbColor={value ? colors.white : colors.white}
        ios_backgroundColor={colors.borderLight}
        style={styles.switch}
      />
    </View>
  );

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Preferences
            </AppText>
            {hasChanges && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePreferences}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save preferences"
              >
                <AppText size="body" weight="bold" color={colors.accentTeal}>
                  {isSaving ? 'Saving...' : 'Save'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Age Preferences */}
            {renderSectionHeader(
              'Age Range',
              'Choose the age range of people you would like to meet.',
              'people'
            )}
            <View style={styles.card}>
              <View style={styles.ageDisplay}>
                <View style={styles.ageValue}>
                  <AppText size="h2" weight="bold" color={colors.accentTeal}>
                    {preferences.minAge}
                  </AppText>
                  <AppText size="body" color={colors.textSecondary}>
                    Minimum
                  </AppText>
                </View>
                <AppText size="h3" color={colors.textMuted}>to</AppText>
                <View style={styles.ageValue}>
                  <AppText size="h2" weight="bold" color={colors.accentTeal}>
                    {preferences.maxAge}
                  </AppText>
                  <AppText size="body" color={colors.textSecondary}>
                    Maximum
                  </AppText>
                </View>
              </View>

              <AppText size="body" weight="semibold" color={colors.textPrimary} style={styles.sliderLabel}>
                Minimum Age: {preferences.minAge}
              </AppText>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={90}
                step={1}
                value={preferences.minAge}
                onValueChange={(value) => updatePreference('minAge', Math.round(value))}
                minimumTrackTintColor={colors.accentTeal}
                maximumTrackTintColor={colors.borderLight}
                thumbTintColor={colors.accentTeal}
              />

              <AppText size="body" weight="semibold" color={colors.textPrimary} style={styles.sliderLabel}>
                Maximum Age: {preferences.maxAge}
              </AppText>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={100}
                step={1}
                value={preferences.maxAge}
                onValueChange={(value) => updatePreference('maxAge', Math.round(value))}
                minimumTrackTintColor={colors.accentTeal}
                maximumTrackTintColor={colors.borderLight}
                thumbTintColor={colors.accentTeal}
              />
            </View>

            {/* Distance Preferences */}
            {renderSectionHeader(
              'Distance',
              'How far away can people be?',
              'location'
            )}
            <View style={styles.card}>
              <View style={styles.distanceDisplay}>
                <AppText size="h2" weight="bold" color={colors.accentTeal}>
                  {preferences.maxDistance}
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  miles away
                </AppText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={100}
                step={5}
                value={preferences.maxDistance}
                onValueChange={(value) => updatePreference('maxDistance', Math.round(value))}
                minimumTrackTintColor={colors.accentTeal}
                maximumTrackTintColor={colors.borderLight}
                thumbTintColor={colors.accentTeal}
              />
              <View style={styles.sliderLabels}>
                <AppText size="small" color={colors.textMuted}>5 mi</AppText>
                <AppText size="small" color={colors.textMuted}>100 mi</AppText>
              </View>
            </View>

            {/* Filter Options */}
            {renderSectionHeader(
              'Filters',
              'Choose who you want to see.',
              'filter'
            )}
            <View style={styles.card}>
              {renderToggle(
                'Online Now',
                'Only show people who are currently online',
                preferences.showOnlineOnly,
                (value) => updatePreference('showOnlineOnly', value)
              )}
              <View style={styles.divider} />
              {renderToggle(
                'Verified Only',
                'Only show people with verified profiles',
                preferences.showVerifiedOnly,
                (value) => updatePreference('showVerifiedOnly', value)
              )}
            </View>

            {/* Notification Settings */}
            {renderSectionHeader(
              'Notifications',
              'Choose how you want to be notified.',
              'notifications'
            )}
            <View style={styles.card}>
              {renderToggle(
                'New Matches',
                'Get notified when you match with someone',
                preferences.enableMatchNotifications,
                (value) => updatePreference('enableMatchNotifications', value)
              )}
              <View style={styles.divider} />
              {renderToggle(
                'New Messages',
                'Get notified when you receive a message',
                preferences.enableMessageNotifications,
                (value) => updatePreference('enableMessageNotifications', value)
              )}
              <View style={styles.divider} />
              {renderToggle(
                'Daily Reminder',
                `Get a friendly reminder each morning at ${preferences.dailyReminderHour}:00 AM`,
                preferences.enableDailyReminder,
                (value) => updatePreference('enableDailyReminder', value)
              )}

              {preferences.enableDailyReminder && (
                <View style={styles.reminderTimeSection}>
                  <AppText size="body" weight="semibold" color={colors.textPrimary}>
                    Reminder Time: {preferences.dailyReminderHour}:00 AM
                  </AppText>
                  <Slider
                    style={styles.slider}
                    minimumValue={6}
                    maximumValue={12}
                    step={1}
                    value={preferences.dailyReminderHour}
                    onValueChange={(value) => updatePreference('dailyReminderHour', Math.round(value))}
                    minimumTrackTintColor={colors.accentTeal}
                    maximumTrackTintColor={colors.borderLight}
                    thumbTintColor={colors.accentTeal}
                  />
                  <View style={styles.sliderLabels}>
                    <AppText size="small" color={colors.textMuted}>6 AM</AppText>
                    <AppText size="small" color={colors.textMuted}>12 PM</AppText>
                  </View>
                </View>
              )}
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <Ionicons name="help-circle" size={24} color={colors.accentTeal} />
              <AppText size="body" color={colors.textSecondary} style={styles.helpText}>
                These settings help us show you people who match your preferences.
                You can change them anytime.
              </AppText>
            </View>

            {/* Bottom Padding */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  saveButton: {
    marginLeft: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionDescription: {
    marginLeft: 40,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  ageValue: {
    alignItems: 'center',
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sliderLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 50, // Larger touch area for seniors
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    marginTop: 4,
    lineHeight: 20,
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }], // Larger switch for seniors
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  reminderTimeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 32,
    padding: 20,
    backgroundColor: colors.accentMint,
    borderRadius: 16,
  },
  helpText: {
    flex: 1,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
  },
});
