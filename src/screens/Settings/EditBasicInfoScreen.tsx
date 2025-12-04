import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TextInputField from "@/src/components/forms/TextInputField";
import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import DatePickerInput from "@/src/components/inputs/DatePickerInput";
import SelectField from "@/src/components/forms/SelectField";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";

const MOCK_PROFILE = {
  firstName: "Felix",
  lastName: "Cruz",
  nickName: "Tayix",
  birthday: "02/28/1957",
  age: "65",
  country: "Phil",
  civilStatus: "Widowed",
  city: "Taytay",
  hobby: "Cooking",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
};

type EditBasicNav = NativeStackNavigationProp<AppStackParamList>;

export default function EditBasicInfoScreen() {
  const navigation = useNavigation<EditBasicNav>();

  const [profile, setProfile] = useState(MOCK_PROFILE);

  const selectOptions = useMemo(
    () => ({
      country: ["Phil", "USA", "Canada"],
      civilStatus: ["Single", "Married", "Widowed"],
      city: ["Taytay", "Manila", "Cebu"],
      hobby: ["Cooking", "Travel", "Music"],
    }),
    []
  );

  const cycleOption = (field: keyof typeof profile, options: string[]) => {
    const currentIndex = options.indexOf(profile[field] as string);
    const nextValue = options[(currentIndex + 1) % options.length];
    setProfile({ ...profile, [field]: nextValue });
  };

  const handleGoBack = () => navigation.goBack();

  const handleNext = () => navigation.navigate("EditAboutYouScreen");

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={handleGoBack}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <AppText size="h3" weight="bold" style={styles.headerTitle}>
              Settings
            </AppText>

            <View style={styles.logoRow}>
              <Image
                source={require("@/src/assets/icons/tander-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <AppText weight="bold" color={colors.accentBlue}>
                TANDER
              </AppText>
            </View>
          </View>

          <View style={styles.avatarCard}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={colors.white} />
              </View>
            </View>
            <View>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                {`${profile.firstName} ${profile.lastName}`}
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                Edit profile photo
              </AppText>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Basic Info
            </AppText>
          </View>

          <View style={styles.card}>
            <TextInputField
              label="First Name"
              value={profile.firstName}
              onChangeText={(text) => setProfile({ ...profile, firstName: text })}
            />

            <TextInputField
              label="Last Name"
              value={profile.lastName}
              onChangeText={(text) => setProfile({ ...profile, lastName: text })}
            />

            <TextInputField
              label="Nick Name"
              value={profile.nickName}
              onChangeText={(text) => setProfile({ ...profile, nickName: text })}
            />

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <DatePickerInput
                  label="Birthday"
                  value={profile.birthday}
                  onChangeText={(text) => setProfile({ ...profile, birthday: text })}
                />
              </View>
              <View style={styles.flexItem}>
                <TextInputField
                  label="Age"
                  value={profile.age}
                  onChangeText={(text) => setProfile({ ...profile, age: text })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <SelectField
                  label="Country"
                  value={profile.country}
                  onPress={() => cycleOption("country", selectOptions.country)}
                  placeholder="Select country"
                />
              </View>
              <View style={styles.flexItem}>
                <SelectField
                  label="Civil Status"
                  value={profile.civilStatus}
                  onPress={() =>
                    cycleOption("civilStatus", selectOptions.civilStatus)
                  }
                  placeholder="Select status"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <SelectField
                  label="City/Province"
                  value={profile.city}
                  onPress={() => cycleOption("city", selectOptions.city)}
                  placeholder="Select city"
                />
              </View>
              <View style={styles.flexItem}>
                <SelectField
                  label="Hobby"
                  value={profile.hobby}
                  onPress={() => cycleOption("hobby", selectOptions.hobby)}
                  placeholder="Select hobby"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.nextButton}
            onPress={handleNext}
          >
            <AppText weight="bold" color={colors.white} style={{ textAlign: "center" }}>
              Continue to About You
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.white}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 38,
    height: 38,
  },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 20,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionHeader: {
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 4,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  flexItem: {
    flex: 1,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
