import React, { useState, useMemo, useRef } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  SectionList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  /** Enable alphabetical sections with letter jump for long lists (>20 items) */
  enableAlphabetNav?: boolean;
}

// Alphabet for quick navigation
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function PickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchPlaceholder = "Search...",
  enableSearch = true,
  enableAlphabetNav = true,
}: PickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const sectionListRef = useRef<SectionList>(null);
  const flatListRef = useRef<FlatList>(null);

  // Determine if we should show alphabet navigation (for long lists)
  const showAlphabetNav = enableAlphabetNav && options.length > 20 && !searchQuery;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Group options by first letter for sectioned list
  const sectionedData = useMemo(() => {
    if (!showAlphabetNav) return [];

    const grouped: { [key: string]: string[] } = {};
    options.forEach((option) => {
      const firstLetter = option.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(option);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));
  }, [options, showAlphabetNav]);

  // Get available letters for navigation
  const availableLetters = useMemo(() => {
    return sectionedData.map(section => section.title);
  }, [sectionedData]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery("");
    onClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  // Jump to letter section
  const jumpToLetter = (letter: string) => {
    const sectionIndex = sectionedData.findIndex(s => s.title === letter);
    if (sectionIndex !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    }
  };

  const renderOption = ({ item }: { item: string }) => {
    const isSelected = item === selectedValue;
    return (
      <Pressable
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => handleSelect(item)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${item}${isSelected ? ', selected' : ''}`}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
          ]}
        >
          {item}
        </Text>
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#F5A14B" />
          </View>
        )}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* Header - Improved for elderly users */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close picker"
            >
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Search Bar - Larger for elderly users */}
          {enableSearch && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={22} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={22} color="#999" />
                </Pressable>
              )}
            </View>
          )}

          {/* Results count for accessibility */}
          {searchQuery && (
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}

          {/* Main content area with optional alphabet nav */}
          <View style={styles.contentRow}>
            {/* Options List */}
            {showAlphabetNav ? (
              <SectionList
                ref={sectionListRef}
                sections={sectionedData}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderOption}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled={true}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                getItemLayout={(data, index) => ({
                  length: 60,
                  offset: 60 * index,
                  index,
                })}
                style={styles.listContainer}
              />
            ) : (
              <FlatList
                ref={flatListRef}
                data={filteredOptions}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderOption}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                style={styles.listContainer}
              />
            )}

            {/* Alphabet Navigation Sidebar - for long lists */}
            {showAlphabetNav && (
              <View style={styles.alphabetNav}>
                {ALPHABET.map((letter) => {
                  const isAvailable = availableLetters.includes(letter);
                  return (
                    <TouchableOpacity
                      key={letter}
                      onPress={() => isAvailable && jumpToLetter(letter)}
                      style={[
                        styles.alphabetLetter,
                        !isAvailable && styles.alphabetLetterDisabled,
                      ]}
                      disabled={!isAvailable}
                      accessibilityLabel={`Jump to ${letter}`}
                    >
                      <Text
                        style={[
                          styles.alphabetLetterText,
                          !isAvailable && styles.alphabetLetterTextDisabled,
                        ]}
                      >
                        {letter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "50%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  // Increased close button size for elderly users (48x48 minimum)
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  searchIcon: {
    position: "absolute",
    left: 36,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 44,
    paddingVertical: 14,
    fontSize: 18,
    color: "#333",
  },
  clearButton: {
    position: "absolute",
    right: 32,
    padding: 8,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  resultsCountText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Increased option size for better touch targets
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    minHeight: 60,
  },
  selectedOption: {
    backgroundColor: "#FFF5ED",
    borderRadius: 12,
    borderBottomColor: "transparent",
    marginVertical: 2,
  },
  optionText: {
    fontSize: 18,
    color: "#333",
    flex: 1,
  },
  selectedOptionText: {
    color: "#F5A14B",
    fontWeight: "600",
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  // Section headers for alphabetical grouping
  sectionHeader: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  // Alphabet navigation sidebar
  alphabetNav: {
    width: 28,
    backgroundColor: "#F9FAFB",
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#E5E5E5",
  },
  alphabetLetter: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  alphabetLetterDisabled: {
    opacity: 0.3,
  },
  alphabetLetterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F5A14B",
  },
  alphabetLetterTextDisabled: {
    color: "#999",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
  },
});
