import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import colors from "../../config/colors";

interface PhotoUploadSectionProps {
  title: string;
  helperText: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos: number;
  columns?: number;
}

export default function PhotoUploadSection({
  title,
  helperText,
  photos,
  onPhotosChange,
  maxPhotos,
  columns = 3,
}: PhotoUploadSectionProps) {
  // Request permissions and pick image
  const pickImage = async (index: number) => {
    try {
      // Request permissions
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Sorry, we need camera roll permissions to upload photos."
          );
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...photos];
        newPhotos[index] = result.assets[0].uri;
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    Alert.alert("Remove Photo", "Do you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const newPhotos = [...photos];
          newPhotos[index] = "";
          onPhotosChange(newPhotos);
        },
      },
    ]);
  };

  // Render upload slots
  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < maxPhotos; i++) {
      const hasPhoto = photos[i];

      slots.push(
        <Pressable
          key={i}
          style={styles.uploadBox}
          onPress={() => pickImage(i)}
          onLongPress={() => hasPhoto && removeImage(i)}
        >
          {hasPhoto ? (
            <Image source={{ uri: hasPhoto }} style={styles.uploadedImage} />
          ) : (
            <Ionicons
              name={i === 0 ? "cloud-upload-outline" : "add"}
              size={i === 0 ? 28 : 32}
              color="#B0B0B0"
            />
          )}
        </Pressable>
      );
    }
    return slots;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={[styles.grid, { gap: 12 }]}>{renderSlots()}</View>

      <Text style={styles.helperText}>{helperText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,

    // Shadow
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  uploadBox: {
    width: 95,
    height: 95,
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
