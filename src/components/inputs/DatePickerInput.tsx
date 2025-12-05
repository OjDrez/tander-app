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
  placeholder = "mm/dd/yyyy",
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
        return new Date(year, month, day);
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

  const borderColor = touched && error ? "#D9534F" : "#E5E5E5";

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

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const displayValue = value || "";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[styles.inputWrapper, { borderColor }]}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.input,
            !displayValue && { color: "#BDBDBD" },
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
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirm}>
                  <Text style={styles.doneBtn}>Done</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                textColor="#000"
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
    marginBottom: 18,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 14,
    color: "#333",
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  input: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#D9534F",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  cancelBtn: {
    fontSize: 16,
    color: "#999",
  },
  doneBtn: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
