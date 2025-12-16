import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PillSelectorProps {
  items: string[];
  value: string[];
  onChange: (items: string[]) => void;
  /** Minimum selections required (shows counter if > 0) */
  minSelections?: number;
  /** Maximum selections allowed */
  maxSelections?: number;
}

export default function PillSelector({
  items,
  value,
  onChange,
  minSelections = 0,
  maxSelections,
}: PillSelectorProps) {
  const toggleItem = (item: string) => {
    const isSelected = value.includes(item);

    if (isSelected) {
      // Always allow deselection
      onChange(value.filter((i) => i !== item));
    } else {
      // Check max selections before adding
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if at max
      }
      onChange([...value, item]);
    }
  };

  const isAtMax = maxSelections && value.length >= maxSelections;

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = value.includes(item);
        const isDisabled = !isSelected && isAtMax;

        return (
          <Pressable
            key={item}
            onPress={() => !isDisabled && toggleItem(item)}
            style={[
              styles.pill,
              isSelected && styles.active,
              isDisabled && styles.disabled,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: isSelected,
              disabled: isDisabled,
            }}
            accessibilityLabel={`${item}${isSelected ? ', selected' : ''}`}
            accessibilityHint={isSelected ? "Double tap to deselect" : "Double tap to select"}
          >
            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#FFF"
                style={styles.checkIcon}
              />
            )}
            <Text
              style={[
                styles.text,
                isSelected && styles.activeText,
                isDisabled && styles.disabledText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 12,
  },
  // Increased size for elderly users - minimum 48px touch target
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    minHeight: 48,
  },
  active: {
    backgroundColor: "#F5A14B",
    borderColor: "#F5A14B",
  },
  disabled: {
    opacity: 0.5,
  },
  checkIcon: {
    marginRight: 6,
  },
  // Improved contrast for elderly users
  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  activeText: {
    color: "#FFF",
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
});
