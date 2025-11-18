import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import fileUploadService from '../../../../services/fileUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../../../constants';
import styles from '../Status.styles';

const MyStatusAvatar = ({ fileId, statusUrl, statusCount, onAddPress }) => {
  const { colors } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvatarUrl = async () => {
      setLoading(true);
      if (fileId) {
        try {
          const url = await fileUploadService.getFileViewUrl(fileId);
          if (url) {
            setAvatarUrl(url);
          }
        } catch (error) {
          console.error('Error loading my status avatar URL:', error);
          if (statusUrl) {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const baseUrl = statusUrl.startsWith('http') 
                ? statusUrl 
                : `${API_CONFIG.BASE_URL}${statusUrl}`;
              const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
              setAvatarUrl(finalUrl);
            } catch (err) {
              console.error('Error getting token:', err);
            }
          }
        }
      } else if (statusUrl) {
        try {
          const token = await AsyncStorage.getItem('authToken');
          const baseUrl = statusUrl.startsWith('http') 
            ? statusUrl 
            : `${API_CONFIG.BASE_URL}${statusUrl}`;
          const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
          setAvatarUrl(finalUrl);
        } catch (error) {
          console.error('Error getting token:', error);
        }
      }
      setLoading(false);
    };
    
    loadAvatarUrl();
  }, [fileId, statusUrl]);

  if (loading) {
    return (
      <View style={[styles.myStatusAvatar, { backgroundColor: colors.divider }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (avatarUrl) {
    return (
      <View style={styles.myStatusAvatarContainer}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.myStatusAvatarImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.addMoreStatusButton, { backgroundColor: colors.primary }]}
          onPress={onAddPress}
          activeOpacity={0.8}
        >
          <Text style={styles.addMoreStatusButtonText}>➕</Text>
        </TouchableOpacity>
        {statusCount > 1 && (
          <View style={[styles.statusCountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.statusCountText}>{statusCount}</Text>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={[styles.myStatusAvatar, { backgroundColor: colors.divider }]}>
      <Text style={styles.addStatusIcon}>➕</Text>
    </View>
  );
};

export default MyStatusAvatar;

