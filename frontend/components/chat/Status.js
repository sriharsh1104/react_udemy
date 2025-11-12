import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import statusService from '../../services/statusService';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { API_CONFIG } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive sizes
const getStatusItemWidth = () => {
  const padding = SPACING.md * 2;
  const gaps = SPACING.md * 3; // 3 gaps between 4 items
  return (SCREEN_WIDTH - padding - gaps) / 4;
};

const STATUS_AVATAR_SIZE = SCREEN_WIDTH < 360 ? 50 : 56;
const STATUS_AVATAR_RADIUS = STATUS_AVATAR_SIZE / 2;

// Status Content Viewer Component
const StatusContentView = ({ status, onClose, onNext, onPrev, currentIndex, totalStatuses }) => {
  const { colors } = useTheme();
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  const statusUrl = status?.statusUrl?.startsWith('http') 
    ? status.statusUrl 
    : status?.statusUrl 
      ? `${API_CONFIG.BASE_URL}${status.statusUrl}` 
      : null;
  
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

const Status = ({ userEmail, contacts = [] }) => {
  const { colors } = useTheme();
  const [statuses, setStatuses] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [currentStatuses, setCurrentStatuses] = useState([]);

  useEffect(() => {
    loadStatuses();
  }, [contacts, userEmail]);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const result = await statusService.getStatusFeed();
      if (result.success) {
        setStatuses(result.statuses || []);
        setMyStatus(result.myStatus || null);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async () => {
    try {
      // Request permissions first
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera roll permissions to add status');
          return;
        }
      }

      Alert.alert(
        'Add Status',
        'Choose an option',
        [
          { 
            text: '📷 Gallery', 
            onPress: () => pickFromGallery() 
          },
          { 
            text: '📸 Camera', 
            onPress: () => pickFromCamera() 
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error adding status:', error);
      Alert.alert('Error', 'Failed to add status');
    }
  };

  const pickFromGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const isVideo = file.type.startsWith('video/');
              const fileObj = {
                uri: URL.createObjectURL(file),
                file: file,
                type: isVideo ? 'video' : 'image',
                mimeType: file.type,
                name: file.name || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                size: file.size || 0,
              };
              await uploadStatus(fileObj, isVideo ? 'video' : 'image');
            }
            resolve();
          };
          input.oncancel = () => resolve();
          input.click();
        });
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        const file = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, isVideo ? 'video' : 'image');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const pickFromCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Camera is not available on web. Please use Gallery option.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions');
        return;
      }

      Alert.alert(
        'Take Photo/Video',
        'Choose media type',
        [
          { text: 'Photo', onPress: () => takePhoto() },
          { text: 'Video', onPress: () => takeVideo() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `status_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const takeVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'video',
          mimeType: asset.mimeType || 'video/mp4',
          name: asset.fileName || `status_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'video');
      }
    } catch (error) {
      console.error('Error taking video:', error);
      Alert.alert('Error', 'Failed to take video');
    }
  };

  const uploadStatus = async (file, type) => {
    try {
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024;
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        Alert.alert('File Too Large', 'Image size must be less than 2MB');
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        Alert.alert('File Too Large', 'Video size must be less than 5MB');
        return;
      }
      
      setLoading(true);
      
      const result = await statusService.uploadStatus(file, type);
      
      if (result.success) {
        await loadStatuses();
      } else {
        Alert.alert('Upload Failed', result.message || 'Failed to upload status');
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      Alert.alert('Error', 'Failed to upload status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusPress = async (contact) => {
    // For now, we'll show a single status. In future, can implement multiple statuses per contact
    const statusUrl = contact.statusUrl?.startsWith('http') 
      ? contact.statusUrl 
      : contact.statusUrl 
        ? `${API_CONFIG.BASE_URL}${contact.statusUrl}` 
        : null;
    
    if (!statusUrl) return;

    const statusData = {
      ...contact,
      statusUrl,
      email: contact.email,
      name: contact.name,
      statusTime: contact.statusTime,
    };

    setCurrentStatuses([statusData]);
    setSelectedStatusIndex(0);
    setSelectedContact(contact);
    setShowStatusViewer(true);

    // Mark as viewed
    if (contact.statusId) {
      await statusService.markAsViewed(contact.statusId);
      await loadStatuses();
    }
  };

  const handleMyStatusPress = async () => {
    if (!myStatus) {
      handleAddStatus();
      return;
    }

    const statusUrl = myStatus.statusUrl?.startsWith('http') 
      ? myStatus.statusUrl 
      : myStatus.statusUrl 
        ? `${API_CONFIG.BASE_URL}${myStatus.statusUrl}` 
        : null;
    
    if (!statusUrl) return;

    const statusData = {
      ...myStatus,
      statusUrl,
      email: userEmail,
      name: userEmail.split('@')[0],
      statusTime: myStatus.statusTime,
    };

    setCurrentStatuses([statusData]);
    setSelectedStatusIndex(0);
    setSelectedContact(null);
    setShowStatusViewer(true);
  };

  const renderStatusItem = ({ item, index }) => {
    const statusUrl = item.statusUrl?.startsWith('http') 
      ? item.statusUrl 
      : item.statusUrl 
        ? `${API_CONFIG.BASE_URL}${item.statusUrl}` 
        : null;
    
    const hasUnviewed = item.hasUnviewedStatus;
    const borderColor = hasUnviewed ? colors.primary : colors.divider;
    const borderWidth = hasUnviewed ? 3 : 2;
    const itemWidth = getStatusItemWidth();
    const isLastInRow = (index + 1) % 4 === 0;

    return (
      <TouchableOpacity
        style={[styles.statusItem, { width: itemWidth }, isLastInRow && styles.statusItemLast]}
        onPress={() => handleStatusPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusAvatarContainer, { borderColor, borderWidth }]}>
          {statusUrl ? (
            <Image
              source={{ uri: statusUrl }}
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={statuses}
        renderItem={renderStatusItem}
        keyExtractor={(item) => `status-${item.email}`}
        numColumns={4}
        contentContainerStyle={styles.statusList}
        columnWrapperStyle={statuses.length > 0 ? styles.statusRow : null}
        ListHeaderComponent={
          <View style={styles.myStatusHeader}>
            <TouchableOpacity
              style={[styles.myStatusItem, { width: getStatusItemWidth(), marginLeft: SPACING.md }]}
              onPress={handleMyStatusPress}
              activeOpacity={0.7}
            >
              <View style={styles.myStatusContainer}>
                {myStatus?.statusUrl ? (
                  <Image
                    source={{ 
                      uri: myStatus.statusUrl.startsWith('http') 
                        ? myStatus.statusUrl 
                        : `${API_CONFIG.BASE_URL}${myStatus.statusUrl}` 
                    }}
                    style={styles.myStatusAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.myStatusAvatar, { backgroundColor: colors.divider }]}>
                    <Text style={styles.addStatusIcon}>➕</Text>
                  </View>
                )}
                {!myStatus && (
                  <View style={[styles.addStatusBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.addStatusBadgeText}>➕</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.myStatusName, { color: colors.text }]} numberOfLines={1}>
                My Status
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No status updates
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Your contacts haven't shared any status updates
            </Text>
          </View>
        }
      />

      {/* Status Viewer Modal */}
      <Modal
        visible={showStatusViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowStatusViewer(false);
          setCurrentStatuses([]);
          setSelectedStatusIndex(0);
        }}
      >
        <View style={styles.statusViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowStatusViewer(false);
              setCurrentStatuses([]);
              setSelectedStatusIndex(0);
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {currentStatuses.length > 0 && (
            <StatusContentView
              status={currentStatuses[selectedStatusIndex]}
              onClose={() => {
                setShowStatusViewer(false);
                setCurrentStatuses([]);
                setSelectedStatusIndex(0);
              }}
              onNext={() => {
                if (selectedStatusIndex < currentStatuses.length - 1) {
                  setSelectedStatusIndex(selectedStatusIndex + 1);
                }
              }}
              onPrev={() => {
                if (selectedStatusIndex > 0) {
                  setSelectedStatusIndex(selectedStatusIndex - 1);
                }
              }}
              currentIndex={selectedStatusIndex}
              totalStatuses={currentStatuses.length}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusList: {
    padding: SPACING.md,
    paddingLeft: 0,
    paddingBottom: SPACING.xl,
  },
  myStatusHeader: {
    width: '100%',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingLeft: 0,
    paddingRight: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    alignItems: 'flex-start',
  },
  myStatusItem: {
    alignItems: 'center',
  },
  myStatusContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  myStatusAvatar: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.receivedMessage,
  },
  myStatusAvatarImage: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    borderWidth: 2.5,
    borderColor: COLORS.divider,
  },
  addStatusIcon: {
    fontSize: SCREEN_WIDTH < 360 ? 22 : 26,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  addStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: SCREEN_WIDTH < 360 ? 20 : 22,
    height: SCREEN_WIDTH < 360 ? 20 : 22,
    borderRadius: SCREEN_WIDTH < 360 ? 10 : 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addStatusBadgeText: {
    fontSize: SCREEN_WIDTH < 360 ? 10 : 12,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  myStatusName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusRow: {
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusItemLast: {
    marginRight: 0,
  },
  statusAvatarContainer: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusAvatarImage: {
    width: '100%',
    height: '100%',
  },
  statusAvatarText: {
    fontSize: SCREEN_WIDTH < 360 ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: '100%',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContentView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusViewerInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  statusViewerName: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
  },
  statusViewerTime: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    opacity: 0.8,
  },
  statusNavigation: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    alignSelf: 'flex-end',
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
});

export default Status;

