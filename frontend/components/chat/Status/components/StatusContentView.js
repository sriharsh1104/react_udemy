import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { COLORS } from '../../../../constants';
import fileUploadService from '../../../../services/fileUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../../../constants';
import styles from '../Status.styles';

const StatusContentView = ({ status, onClose, onNext, onPrev, currentIndex, totalStatuses }) => {
  const [statusUrl, setStatusUrl] = useState(null);
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  
  useEffect(() => {
    const loadStatusUrl = async () => {
      if (!status) return;
      
      if (status.fileId) {
        try {
          const url = await fileUploadService.getFileViewUrl(status.fileId);
          setStatusUrl(url);
        } catch (error) {
          console.error('Error loading status URL:', error);
          const fallbackUrl = status.statusUrl?.startsWith('http') 
            ? status.statusUrl 
            : status.statusUrl 
              ? `${API_CONFIG.BASE_URL}${status.statusUrl}` 
              : null;
          setStatusUrl(fallbackUrl);
        }
      } else if (status.statusUrl) {
        const baseUrl = status.statusUrl.startsWith('http') 
          ? status.statusUrl 
          : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
        
        try {
          const token = await AsyncStorage.getItem('authToken');
          const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
          setStatusUrl(finalUrl);
        } catch (error) {
          console.error('Error getting token:', error);
          setStatusUrl(baseUrl);
        }
      } else {
        setStatusUrl(null);
      }
    };
    
    loadStatusUrl();
  }, [status]);
  
  const player = useVideoPlayer(isVideo && statusUrl ? statusUrl : '', (player) => {
    if (isVideo && player && statusUrl) {
      player.loop = true;
      player.play();
    }
  });

  if (!status || !statusUrl) {
    return (
      <View style={styles.statusContentView}>
        <Text style={{ color: COLORS.white }}>No status content</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusContentView}>
      {isVideo ? (
        <VideoView
          player={player}
          style={styles.statusVideo}
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: statusUrl }}
          style={styles.statusImage}
          resizeMode="contain"
        />
      )}
      <View style={styles.statusViewerInfo}>
        <Text style={styles.statusViewerName}>
          {status.name || status.email?.split('@')[0]}
        </Text>
        <Text style={styles.statusViewerTime}>
          {status.statusTime || 'Just now'}
        </Text>
      </View>
      {totalStatuses > 1 && (
        <View style={styles.statusNavigation}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={onPrev}
            >
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>
          )}
          {currentIndex < totalStatuses - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={onNext}
            >
              <Text style={styles.navButtonText}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default StatusContentView;

