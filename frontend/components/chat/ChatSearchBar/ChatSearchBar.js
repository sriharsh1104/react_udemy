import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ChatSearchBar.styles';

const ChatSearchBar = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  currentIndex,
  totalResults,
  onPrevious,
  onNext,
  colors: customColors,
}) => {
  const { colors: themeColors } = useTheme();
  const colors = customColors || themeColors;

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <View style={styles.searchRow}>
        {/* Search Input */}
        <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search messages..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation Buttons */}
        {searchQuery.trim().length > 0 && totalResults > 0 && (
          <View style={styles.navigationContainer}>
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
              {currentIndex + 1} / {totalResults}
            </Text>
            <TouchableOpacity
              onPress={onPrevious}
              disabled={currentIndex === 0}
              style={[
                styles.navButton,
                { backgroundColor: colors.inputBackground },
                currentIndex === 0 && styles.navButtonDisabled
              ]}
            >
              <Text style={[
                styles.navButtonText,
                { color: currentIndex === 0 ? colors.textSecondary : colors.primary }
              ]}>
                ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              disabled={currentIndex === totalResults - 1}
              style={[
                styles.navButton,
                { backgroundColor: colors.inputBackground },
                currentIndex === totalResults - 1 && styles.navButtonDisabled
              ]}
            >
              <Text style={[
                styles.navButtonText,
                { color: currentIndex === totalResults - 1 ? colors.textSecondary : colors.primary }
              ]}>
                ↓
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default ChatSearchBar;

