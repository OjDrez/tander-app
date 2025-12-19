import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { DiscoveryProfile } from '@/src/types/matching';
import { photoApi } from '@/src/api/photoApi';

interface SuggestionsCarouselProps {
  suggestions: DiscoveryProfile[];
  onFilterPress: () => void;
}

interface SuggestionCardProps {
  person: DiscoveryProfile;
  onPress: () => void;
}

/**
 * Individual suggestion card with image loading state
 */
function SuggestionCard({ person, onPress }: SuggestionCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const photoUrl = photoApi.getPhotoUrl(person.profilePhotoUrl);
  const hasPhoto = !!photoUrl && !imageError;

  const locationText = [
    person.age ? `${person.age}` : '',
    person.location || 'Nearby',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${person.displayName}'s profile`}
    >
      <View style={styles.avatarContainer}>
        {hasPhoto ? (
          <>
            {isImageLoading && (
              <View style={[styles.suggestionAvatar, styles.suggestionAvatarPlaceholder]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            <Image
              source={{ uri: photoUrl }}
              style={[styles.suggestionAvatar, isImageLoading && styles.hidden]}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false);
                setImageError(true);
              }}
            />
          </>
        ) : (
          <View style={[styles.suggestionAvatar, styles.suggestionAvatarPlaceholder]}>
            <Ionicons name="person" size={32} color={colors.textMuted} />
          </View>
        )}
      </View>
      <AppText weight="semibold" style={styles.suggestionName} numberOfLines={1}>
        {person.displayName}
      </AppText>
      <AppText size="caption" color={colors.textSecondary} style={styles.suggestionMeta}>
        {locationText}
      </AppText>
    </TouchableOpacity>
  );
}

/**
 * Empty state when no suggestions are available
 */
function EmptySuggestions() {
  return (
    <View style={styles.noSuggestionsCard}>
      <Ionicons name="people-outline" size={48} color={colors.textMuted} />
      <AppText size="body" color={colors.textSecondary} style={styles.noSuggestionsText}>
        No suggestions available right now. Check back later!
      </AppText>
    </View>
  );
}

/**
 * SuggestionsCarousel component - Horizontal scrollable list of profile suggestions
 * Includes section header with filter button
 */
export function SuggestionsCarousel({ suggestions, onFilterPress }: SuggestionsCarouselProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handleProfilePress = (userId: number) => {
    navigation.navigate('ViewProfileScreen', {
      userId: userId.toString(),
    });
  };

  return (
    <>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <AppText weight="semibold" size="h4" style={styles.sectionTitle}>
            People You May Know!
          </AppText>
          <AppText size="caption" color={colors.textSecondary}>
            Fresh picks curated for you
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.filterPill}
          activeOpacity={0.9}
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filter profiles"
        >
          <Ionicons name="options-outline" size={16} color={colors.accentBlue} />
          <AppText weight="semibold" color={colors.accentBlue} size="caption">
            Filters
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Suggestions List */}
      {suggestions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsRow}
        >
          {suggestions.map((person) => (
            <SuggestionCard
              key={person.userId}
              person={person}
              onPress={() => handleProfilePress(person.userId)}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptySuggestions />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  suggestionsRow: {
    gap: 14,
    paddingRight: 8,
  },
  suggestionCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  avatarContainer: {
    position: 'relative',
    width: 84,
    height: 84,
  },
  suggestionAvatar: {
    height: 84,
    width: 84,
    borderRadius: 14,
    backgroundColor: colors.borderMedium,
  },
  suggestionAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hidden: {
    opacity: 0,
  },
  suggestionName: {
    textAlign: 'center',
    color: colors.textPrimary,
  },
  suggestionMeta: {
    textAlign: 'center',
  },
  noSuggestionsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  noSuggestionsText: {
    textAlign: 'center',
  },
});

export default SuggestionsCarousel;
