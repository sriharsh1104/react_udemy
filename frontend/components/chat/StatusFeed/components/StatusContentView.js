import React from 'react';
import { View, Text, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { COLORS } from '../../../../constants';
import styles from '../StatusFeed.styles';

const StatusContentView = ({ status }) => {
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  const player = useVideoPlayer(isVideo ? status.statusUrl : '', (player) => {
    if (isVideo && player) {
      player.loop = true;
      player.play();
    }
  });

  if (!status || !status.statusUrl) {
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
          source={{ uri: status.statusUrl }}
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
    </View>
  );
};

export default StatusContentView;

