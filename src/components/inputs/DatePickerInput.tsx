import React, { useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "../../config/colors";

interface DatePickerInputProps {
  label: string;
  value: string;
  onChangeText: (date: string) => void | Promise<void>;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
}

export default function DatePickerInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  placeholder = "Select your birthday",
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  // For senior citizens app, default to a date that makes sense (around 65 years ago)
  const getInitialDate = () => {
    if (value) {
      // Parse MM/DD/YYYY format
      const parts = value.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    // Default to 65 years ago for senior citizens
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 65);
    return defaultDate;
  };

  const [tempDate, setTempDate] = useState<Date>(getInitialDate());

  // Minimum date: 120 years ago (oldest possible person)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  // Maximum date: 60 years ago (must be at least 60 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 60);

  // Fade animation for error message
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (error && touched) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [error, touched]);

  const borderColor = touched && error ? colors.errorBorder : colors.borderMedium;

  const handleDateChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === "android") {
        const formattedDate = formatDate(selectedDate);
        await onChangeText(formattedDate);
      }
    }
  };

  const handleConfirm = async () => {
    const formattedDate = formatDate(tempDate);
    await onChangeText(formattedDate);
    setShowPicker(false);
  };

  // Format date as MM/DD/YYYY to match validation schema
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format for display (user-friendly format)
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parts[2];
      if (month >= 0 && month < 12) {
        return `${monthNames[month]} ${day}, ${year}`;
      }
    }
    return dateStr;
  };

  const displayValue = value ? formatDisplayDate(value) : "";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helper}>Tap to select your birth date</Text>

      <Pressable
        style={[styles.inputWrapper, { borderColor }]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
        accessibilityHint="Opens date picker"
      >
        <Text
          style={[
            styles.input,
            !displayValue && styles.placeholder,
          ]}
        >
          {displayValue || placeholder}
        </Text>
      </Pressable>

      {touched && error ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* iOS Modal Picker */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Your Birthday</Text>
              </View>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={styles.cancelButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  style={styles.doneButton}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm date selection"
                >
                  <Text style={styles.doneBtnText}>Confirm</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                textColor={colors.black}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Android Picker */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 16,
    color: colors.textPrimary,
  },
  helper: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 60,
    justifyContent: "center",
  },
  input: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  placeholder: {
    color: colors.placeholder,
  },
  errorText: {
    marginTop: 8,
    fontSize: 15,
    color: colors.errorBorder,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMedium,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  doneButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.accentTeal,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 17,
    color: colors.white,
    fontWeight: "700",
  },
});
