import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import styles from '../StatusFeed.styles';

const FeedHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onSearchFocus, 
  onClearSearch,
  feedMode,
  onFeedModeChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search profiles..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Feed Mode Toggle */}
      <View style={[styles.feedModeContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.feedModeButton,
            feedMode === 'public' && { backgroundColor: colors.primary },
          ]}
          onPress={() => onFeedModeChange('public')}
        >
          <Text style={[
            styles.feedModeText,
            { color: feedMode === 'public' ? colors.white : colors.text }
          ]}>
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.feedModeButton,
            feedMode === 'private' && { backgroundColor: colors.primary },
          ]}
          onPress={() => onFeedModeChange('private')}
        >
          <Text style={[
            styles.feedModeText,
            { color: feedMode === 'private' ? colors.white : colors.text }
          ]}>
            Private
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FeedHeader;

