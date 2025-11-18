import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import styles from '../StatusFeed.styles';

const SearchResults = ({ 
  visible, 
  searchResults, 
  loadingSearch, 
  searchQuery,
  onProfileVisit,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.searchResultsContainer, { backgroundColor: colors.background }]}>
      {loadingSearch ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `search-${item.email}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.searchResultItem, { borderBottomColor: colors.divider }]}
              onPress={() => onProfileVisit(item.email)}
            >
              <View style={[styles.searchAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.searchAvatarText, { color: colors.white }]}>
                  {item.name?.charAt(0).toUpperCase() || item.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.searchResultInfo}>
                <Text style={[styles.searchResultName, { color: colors.text }]}>
                  {item.name || item.email?.split('@')[0]}
                </Text>
                <Text style={[styles.searchResultEmail, { color: colors.textSecondary }]}>
                  {item.email}
                </Text>
              </View>
              {item.isPrivate && (
                <Text style={styles.privateIcon}>🔒</Text>
              )}
            </TouchableOpacity>
          )}
        />
      ) : searchQuery.trim() ? (
        <View style={styles.noResultsContainer}>
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No profiles found
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default SearchResults;

