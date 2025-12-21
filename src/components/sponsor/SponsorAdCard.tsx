import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { SponsorAdDTO, SponsorProductDTO, SponsorLocationDTO } from '@/src/api/tandyApi';

interface SponsorAdCardProps {
  ad: SponsorAdDTO;
  language?: 'en' | 'tl';
  onProductPress?: (product: SponsorProductDTO) => void;
  onLocationPress?: (location: SponsorLocationDTO) => void;
  onSponsorPress?: () => void;
}

/**
 * SponsorAdCard - Senior-Friendly Sponsor Advertisement Card
 *
 * Designed specifically for elderly users (60+):
 * - LARGE text (18-20px minimum)
 * - BIG touch targets (minimum 56px height)
 * - HIGH contrast colors
 * - CLEAR, simple labels with bilingual support
 * - COMPASSIONATE, helpful messaging
 * - Easy-to-tap buttons with clear icons
 */
export default function SponsorAdCard({
  ad,
  language = 'en',
  onProductPress,
  onLocationPress,
  onSponsorPress,
}: SponsorAdCardProps) {

  // Open sponsor website
  const handleWebsitePress = () => {
    if (ad.sponsorWebsiteUrl) {
      Linking.openURL(ad.sponsorWebsiteUrl);
    }
  };

  // Open location in maps app
  const handleLocationPress = async () => {
    if (ad.nearestLocation) {
      if (onLocationPress) {
        onLocationPress(ad.nearestLocation);
      } else if (ad.nearestLocation.latitude && ad.nearestLocation.longitude) {
        // Open in device maps app
        const lat = ad.nearestLocation.latitude;
        const lng = ad.nearestLocation.longitude;
        const label = encodeURIComponent(ad.nearestLocation.name);

        // Google Maps URL works reliably on both platforms
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        // Try platform-specific maps first for better UX
        if (Platform.OS === 'ios') {
          // Apple Maps URL
          const appleMapsUrl = `maps:?q=${label}&ll=${lat},${lng}`;
          const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
          if (canOpenAppleMaps) {
            Linking.openURL(appleMapsUrl);
            return;
          }
        } else if (Platform.OS === 'android') {
          // Try Google Maps app first with intent
          const googleMapsAppUrl = `google.navigation:q=${lat},${lng}`;
          const canOpenGoogleMapsApp = await Linking.canOpenURL(googleMapsAppUrl);
          if (canOpenGoogleMapsApp) {
            Linking.openURL(googleMapsAppUrl);
            return;
          }
        }

        // Fallback to Google Maps web URL (works on all platforms)
        Linking.openURL(googleMapsUrl).catch((err) => {
          console.error('Failed to open maps:', err);
        });
      }
    }
  };

  // Call the store directly
  const handleCallPress = () => {
    if (ad.nearestLocation?.phone) {
      const phoneNumber = ad.nearestLocation.phone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Format price for display
  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toFixed(2)}`;
  };

  // Get text in preferred language
  const getLocalizedText = (en?: string, tl?: string) => {
    if (language === 'tl' && tl) return tl;
    return en || '';
  };

  // Get bilingual text (show both)
  const getBilingualText = (en: string, tl: string) => {
    return `${en}\n${tl}`;
  };

  return (
    <View style={styles.container}>
      {/* Helpful Header - Shows this is a recommendation */}
      <View style={styles.helpfulHeader}>
        <View style={styles.helpfulIconContainer}>
          <Ionicons name="heart" size={20} color={colors.white} />
        </View>
        <View style={styles.helpfulTextContainer}>
          <AppText size="body" weight="semibold" color={colors.primary}>
            {language === 'tl' ? 'Maaaring Makatulong Ito' : 'This Might Help You'}
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            {language === 'tl' ? 'Batay sa iyong tanong' : 'Based on your question'}
          </AppText>
        </View>
      </View>

      {/* Sponsor Info - Large and Clear */}
      <TouchableOpacity
        style={styles.sponsorSection}
        onPress={onSponsorPress || handleWebsitePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Visit ${ad.sponsorName} website`}
      >
        {ad.sponsorLogoUrl ? (
          <Image
            source={{ uri: ad.sponsorLogoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="storefront" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.sponsorInfo}>
          <AppText style={styles.sponsorName} weight="bold" numberOfLines={1}>
            {ad.sponsorName}
          </AppText>
          {ad.queryCategory && (
            <View style={styles.categoryBadge}>
              <Ionicons name="medical" size={14} color={colors.accentTeal} />
              <AppText size="body" color={colors.accentTeal} weight="semibold">
                {ad.queryCategory === 'medical' ? (language === 'tl' ? 'Gamot' : 'Medicine') :
                 ad.queryCategory === 'wellness' ? (language === 'tl' ? 'Kalusugan' : 'Wellness') :
                 ad.queryCategory.charAt(0).toUpperCase() + ad.queryCategory.slice(1)}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.visitButton}>
          <Ionicons name="open-outline" size={22} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Products Section - Large Cards */}
      {ad.recommendedProducts && ad.recommendedProducts.length > 0 && (
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-handle" size={20} color={colors.textSecondary} />
            <AppText style={styles.sectionTitle} color={colors.textSecondary}>
              {language === 'tl' ? 'Mga Produktong Maaaring Makatulong:' : 'Products That May Help:'}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {ad.recommendedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => onProductPress?.(product)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${product.name}, ${product.price ? formatPrice(product.price, product.currency) : 'Price not available'}`}
              >
                {product.thumbnailUrl || product.imageUrl ? (
                  <Image
                    source={{ uri: product.thumbnailUrl || product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImage, styles.productPlaceholder]}>
                    <Ionicons name="medical" size={36} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <AppText style={styles.productName} weight="semibold" numberOfLines={2}>
                    {getLocalizedText(product.name, product.nameTl)}
                  </AppText>
                  {product.price && (
                    <AppText style={styles.productPrice} weight="bold">
                      {formatPrice(product.price, product.currency)}
                    </AppText>
                  )}
                </View>
                {product.isFeatured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={14} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Nearest Store Section - Big and Easy to Tap */}
      {ad.nearestLocation && (
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.textSecondary} />
            <AppText style={styles.sectionTitle} color={colors.textSecondary}>
              {language === 'tl' ? 'Pinakamalapit na Tindahan:' : 'Nearest Store:'}
            </AppText>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationDetails}>
              <AppText style={styles.locationName} weight="bold" numberOfLines={2}>
                {ad.nearestLocation.name}
              </AppText>
              {ad.nearestLocation.distanceText && (
                <View style={styles.distanceBadge}>
                  <Ionicons name="walk" size={16} color={colors.white} />
                  <AppText style={styles.distanceText}>
                    {ad.nearestLocation.distanceText}
                  </AppText>
                </View>
              )}
              {ad.nearestLocation.address && (
                <AppText style={styles.locationAddress} color={colors.textSecondary} numberOfLines={2}>
                  {ad.nearestLocation.address}
                </AppText>
              )}
              {ad.nearestLocation.operatingHours && (
                <View style={styles.hoursContainer}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <AppText size="body" color={colors.textMuted}>
                    {ad.nearestLocation.operatingHours}
                  </AppText>
                </View>
              )}
            </View>

            {/* Action Buttons - Large and Clear */}
            <View style={styles.actionButtons}>
              {/* Get Directions Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLocationPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={language === 'tl' ? 'Kumuha ng direksyon' : 'Get directions'}
              >
                <Ionicons name="navigate" size={24} color={colors.white} />
                <AppText style={styles.actionButtonText}>
                  {language === 'tl' ? 'Direksyon' : 'Directions'}
                </AppText>
              </TouchableOpacity>

              {/* Call Store Button */}
              {ad.nearestLocation.phone && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.callButton]}
                  onPress={handleCallPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'tl' ? 'Tawagan ang tindahan' : 'Call the store'}
                >
                  <Ionicons name="call" size={24} color={colors.white} />
                  <AppText style={styles.actionButtonText}>
                    {language === 'tl' ? 'Tawag' : 'Call'}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Important Disclaimer - Clear and Visible */}
      {ad.disclaimer && (
        <View style={styles.disclaimer}>
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <AppText style={styles.disclaimerText}>
            {ad.disclaimer}
          </AppText>
        </View>
      )}

      {/* Sponsored Label - Small but visible */}
      <View style={styles.sponsoredFooter}>
        <Ionicons name="megaphone-outline" size={14} color={colors.textMuted} />
        <AppText size="small" color={colors.textMuted}>
          Sponsored / Naka-sponsor
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: colors.accentMint,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Helpful Header Styles
  helpfulHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  helpfulIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpfulTextContainer: {
    flex: 1,
  },

  // Sponsor Section Styles
  sponsorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 80, // Large touch target
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sponsorInfo: {
    flex: 1,
    marginLeft: 14,
  },
  sponsorName: {
    fontSize: 20, // Large for seniors
    lineHeight: 26,
    color: colors.textPrimary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentMint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  visitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Products Section Styles
  productsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  productsScroll: {
    paddingRight: 8,
  },
  productCard: {
    width: 150, // Larger cards
    marginRight: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  productImage: {
    width: 150,
    height: 100, // Taller images
    backgroundColor: colors.backgroundLight,
  },
  productPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
    gap: 4,
  },
  productName: {
    fontSize: 15, // Readable text
    lineHeight: 20,
    color: colors.textPrimary,
  },
  productPrice: {
    fontSize: 17,
    color: colors.accentTeal,
    marginTop: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accentTeal,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Location Section Styles
  locationSection: {
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
  },
  locationDetails: {
    marginBottom: 14,
  },
  locationName: {
    fontSize: 18, // Large for seniors
    lineHeight: 24,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  distanceText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14, // Large touch target
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    minHeight: 56, // Minimum touch target for seniors
  },
  callButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Disclaimer Styles
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6', // Light yellow warning background
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Sponsored Footer
  sponsoredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
