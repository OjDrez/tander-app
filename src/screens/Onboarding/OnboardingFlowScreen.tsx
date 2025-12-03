import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientButton from "@/src/components/buttons/GradientButton";
import OutlineButton from "@/src/components/buttons/OutlineButton";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import OnboardingDots from "@/src/components/onboarding/OnboardingDots";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";

type SlideItem = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  accent: string;
};

const SLIDES: SlideItem[] = [
  {
    id: "1",
    title: "Meet new people nearby",
    description:
      "Connect with others in your area and start meaningful conversations.",
    image: require("../../assets/images/onboard-1st.png"),
    accent: colors.accentTeal,
  },
  {
    id: "2",
    title: "Find meaningful connections",
    description:
      "Discover people who share your interests and values to build lasting bonds.",
    image: require("../../assets/images/onboard2.png"),
    accent: colors.accentBlue,
  },
  {
    id: "3",
    title: "Start conversations that matter",
    description:
      "Share stories, hobbies, and plans together in a safe and welcoming space.",
    image: require("../../assets/images/onboard3.png"),
    accent: colors.primary,
  },
];

export default function OnboardingFlowScreen() {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 55 }),
    []
  );

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const getItemLayout = (_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    } else {
      NavigationService.replace("WelcomeScreen");
    }
  };

  const renderItem = ({ item, index }: { item: SlideItem; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.94, 1, 0.94],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [12, 0, 12],
      extrapolate: "clamp",
    });

    return (
      <View style={[styles.slide, { width }]}> 
        <Animated.View
          style={[
            styles.imageCard,
            {
              transform: [{ scale }, { translateY }],
              shadowColor: item.accent,
            },
          ]}
        >
          <View style={styles.imageWrapper}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
          </View>
        </Animated.View>

        <View style={styles.textBlock}>
          <AppText
            size="small"
            weight="semibold"
            color={item.accent}
            style={styles.stepBadge}
          >
            Step {index + 1}
          </AppText>
          <AppText weight="semibold" size="h3" style={styles.title}>
            {item.title}
          </AppText>
          <AppText
            size="small"
            color={colors.textSecondary}
            style={styles.description}
          >
            {item.description}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screenBackground}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <AppText size="small" weight="semibold" color={colors.textMuted}>
            {`0${currentIndex + 1}/0${SLIDES.length}`}
          </AppText>
          <OutlineButton
            title="Skip"
            onPress={() => NavigationService.replace("WelcomeScreen")}
            style={styles.skipButton}
          />
        </View>

        <Animated.FlatList
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={renderItem}
          ref={flatListRef}
          getItemLayout={getItemLayout}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <OnboardingDots data={SLIDES} scrollX={scrollX} pageWidth={width} />

          <View style={styles.ctaWrapper}>
            <GradientButton
              title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
              onPress={handleNext}
              style={styles.primaryButton}
            />
            <Ionicons
              name="arrow-forward"
              size={22}
              color={colors.white}
              style={styles.ctaIcon}
            />
          </View>
        </View>
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screenBackground: {
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  skipButton: {
    width: 96,
    borderColor: colors.borderMedium,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingBottom: 10,
  },
  slide: {
    alignItems: "center",
  },
  imageCard: {
    width: "88%",
    borderRadius: 28,
    backgroundColor: colors.white,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  imageWrapper: {
    borderRadius: 28,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 320,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 24,
  },
  stepBadge: {
    backgroundColor: colors.accentMint,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 18,
  },
  ctaWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  primaryButton: {
    width: "100%",
  },
  ctaIcon: {
    position: "absolute",
    right: 22,
    top: "50%",
    marginTop: -11,
  },
});
