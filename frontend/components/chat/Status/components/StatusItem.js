import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import fileUploadService from '../../../../services/fileUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../../../constants';
import { Dimensions } from 'react-native';
import styles from '../Status.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStatusItemWidth = () => {
  const padding = 16 * 2;
  const gaps = 16 * 3;
  return (SCREEN_WIDTH - padding - gaps) / 4;
};

const StatusItem = ({ item, index, onPress }) => {
  const { colors } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const hasUnviewed = item.hasUnviewedStatus;
  const borderColor = hasUnviewed ? colors.primary : colors.divider;
  const borderWidth = hasUnviewed ? 3 : 2;
  const itemWidth = getStatusItemWidth();
  const isLastInRow = (index + 1) % 4 === 0;

  useEffect(() => {
    const loadAvatarUrl = async () => {
      if (item.fileId) {
        try {
          const url = await fileUploadService.getFileViewUrl(item.fileId);
          setAvatarUrl(url);
        } catch (error) {
          console.error('Error loading avatar URL:', error);
          if (item.statusUrl) {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const baseUrl = item.statusUrl.startsWith('http') 
                ? item.statusUrl 
                : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
              const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
              setAvatarUrl(finalUrl);
            } catch (err) {
              console.error('Error getting token:', err);
              setAvatarUrl(item.statusUrl.startsWith('http') ? item.statusUrl : `${API_CONFIG.BASE_URL}${item.statusUrl}`);
            }
          }
        }
      } else if (item.statusUrl) {
        try {
          const token = await AsyncStorage.getItem('authToken');
          const baseUrl = item.statusUrl.startsWith('http') 
            ? item.statusUrl 
            : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
          const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
          setAvatarUrl(finalUrl);
        } catch (error) {
          console.error('Error getting token:', error);
          setAvatarUrl(item.statusUrl.startsWith('http') ? item.statusUrl : `${API_CONFIG.BASE_URL}${item.statusUrl}`);
        }
      }
    };
    
    loadAvatarUrl();
  }, [item.fileId, item.statusUrl]);

  return (
    <TouchableOpacity
      style={[styles.statusItem, { width: itemWidth }, isLastInRow && styles.statusItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statusAvatarContainer, { borderColor, borderWidth }]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.statusAvatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.statusAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.statusAvatarText, { color: colors.white }]}>
              {item.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statusName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

export default StatusItem;

