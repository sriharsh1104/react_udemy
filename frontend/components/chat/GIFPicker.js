import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Image, ActivityIndicator, FlatList } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

// Giphy API - Using public beta key (rate limited but free)
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Public beta key
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

const GIFPicker = ({ visible, onClose, onGIFSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Trending GIFs
  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      }
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search GIFs
  const searchGIFs = useCallback(async (query) => {
    if (!query.trim()) {
      fetchTrending();
      setTrending(true);
      return;
    }

    setLoading(true);
    setTrending(false);
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=50&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      }
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTrending]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchQuery.trim()) {
        searchGIFs(searchQuery);
      } else {
        fetchTrending();
        setTrending(true);
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, searchGIFs, fetchTrending]);

  // Load trending on mount
  useEffect(() => {
    if (visible) {
      fetchTrending();
    }
  }, [visible, fetchTrending]);

  const handleGIFSelect = (gif) => {
    if (onGIFSelect) {
      // Send GIF URL as a message
      onGIFSelect(gif.images.fixed_height.url || gif.images.original.url);
    }
  };

  const renderGIFItem = ({ item }) => {
    const gifUrl = item.images.fixed_height_small?.url || item.images.fixed_height?.url;
    
    return (
      <TouchableOpacity
        style={styles.gifItem}
        onPress={() => handleGIFSelect(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: gifUrl }}
          style={styles.gifImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>GIF</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search GIFs..."
              placeholderTextColor={COLORS.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}

          {/* GIF Grid */}
          {!loading && gifs.length > 0 ? (
            <FlatList
              data={gifs}
              renderItem={renderGIFItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gifGrid}
              showsVerticalScrollIndicator={false}
            />
          ) : !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No GIFs found</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.inputBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  gifGrid: {
    padding: SPACING.sm,
  },
  gifItem: {
    flex: 1,
    margin: SPACING.xs,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.receivedMessage,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default GIFPicker;

