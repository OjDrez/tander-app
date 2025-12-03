import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Person = {
  id: string;
  name: string;
  age: number;
  avatar: string;
};

type PeopleYouMayKnowRowProps = {
  people: Person[];
  onSelect: (userId: string) => void;
};

export default function PeopleYouMayKnowRow({
  people,
  onSelect,
}: PeopleYouMayKnowRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>People You May Know!</Text>
        <Ionicons name="heart" size={18} color={colors.primary} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {people.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={styles.item}
            onPress={() => onSelect(person.id)}
            activeOpacity={0.9}
          >
            <View>
              <Image source={{ uri: person.avatar }} style={styles.avatar} />
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={11} color={colors.white} />
              </View>
            </View>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.age}>{person.age}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  row: {
    gap: 16,
    paddingRight: 8,
  },
  item: {
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    height: 66,
    width: 66,
    borderRadius: 33,
    backgroundColor: colors.borderMedium,
  },
  heartBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    height: 18,
    width: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  age: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
