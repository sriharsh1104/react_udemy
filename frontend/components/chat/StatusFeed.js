import React, { useState, useEffect, useRef } from 'react';
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
import contactsService from '../../services/contactsService';
import statusService from '../../services/statusService';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { API_CONFIG } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Status Content Viewer Component
const StatusContentView = ({ status }) => {
  const { colors } = useTheme();
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  // Always call hook, but pass null if not video
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

const StatusFeed = ({ userEmail, contacts = [] }) => {
  const { colors } = useTheme();
  const [statuses, setStatuses] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  useEffect(() => {
    loadStatuses();
  }, [contacts, userEmail]);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const result = await statusService.getStatusFeed();
      if (result.success) {
        setStatuses(result.statuses || []);
        setMyStatus(result.myStatus);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to add status');
        return;
      }

      // Show options: Gallery, Camera, or Cancel
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
        ]
      );
    } catch (error) {
      console.error('Error adding status:', error);
      Alert.alert('Error', 'Failed to add status');
    }
  };

  const pickFromGallery = async () => {
    try {
      // On web, permissions are handled differently
      if (Platform.OS === 'web') {
        // For web, use file input approach
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const isVideo = file.type.startsWith('video/');
              // For web, we need to create a File object that can be used
              const fileObj = {
                uri: URL.createObjectURL(file), // Blob URL for preview
                file: file, // Actual File object for upload
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

      // For mobile platforms
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions');
        return;
      }

      // Directly open gallery with both images and videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
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
      // Web doesn't support camera directly
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Camera is not available on web. Please use Gallery option.');
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions');
        return;
      }

      // Show options for image or video from camera
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Format file object properly
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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Format file object properly
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
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const uploadStatus = async (file, type) => {
    try {
      // Validate file size before upload
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        Alert.alert(
          'File Too Large',
          'Image size must be less than 2MB. Please choose a smaller image.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        Alert.alert(
          'File Too Large',
          'Video size must be less than 5MB. Please choose a smaller video.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert('Uploading', 'Please wait...');
      
      // Upload status
      const result = await statusService.uploadStatus(file, type);
      
      if (result.success) {
        await loadStatuses();
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      Alert.alert('Error', 'Failed to upload status');
    }
  };

  const handleStatusPress = async (status, index) => {
    // Mark as viewed
    if (status.statusId && !status.hasUnviewedStatus) {
      await statusService.markAsViewed(status.statusId);
    }
    
    // Build full status URL
    const fullStatusUrl = status.statusUrl?.startsWith('http') 
      ? status.statusUrl 
      : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
    
    setSelectedStatus({
      ...status,
      statusUrl: fullStatusUrl,
    });
    setShowStatusViewer(true);
    
    // Mark as viewed after opening
    if (status.statusId && status.hasUnviewedStatus) {
      await statusService.markAsViewed(status.statusId);
      // Reload to update viewed status
      setTimeout(() => loadStatuses(), 500);
    }
  };

  const handleViewInfo = async (status) => {
    if (!status.statusId) return;
    
    setLoadingViewers(true);
    setShowViewersModal(true);
    
    try {
      const result = await statusService.getViewers(status.statusId);
      if (result.success) {
        setViewers(result.viewers || []);
      }
    } catch (error) {
      console.error('Error loading viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const renderStatusItem = ({ item, index }) => {
    const name = item.name || item.email?.split('@')[0] || 'Unknown';
    const hasUnviewedStatus = item.hasUnviewedStatus;
    const statusUrl = item.statusUrl?.startsWith('http') 
      ? item.statusUrl 
      : item.statusUrl 
        ? `${API_CONFIG.BASE_URL}${item.statusUrl}` 
        : null;
    
    return (
      <TouchableOpacity
        style={[styles.statusItem, { borderBottomColor: colors.divider }]}
        onPress={() => handleStatusPress(item, index)}
        onLongPress={() => {
          // Only owner can see viewers, so we don't show info for others' status
        }}
      >
        <View style={[styles.statusAvatar, { backgroundColor: colors.primary }]}>
          {statusUrl ? (
            <Image source={{ uri: statusUrl }} style={styles.statusAvatarImage} />
          ) : (
            <Text style={[styles.statusAvatarText, { color: colors.white }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
          {hasUnviewedStatus && (
            <View style={[styles.unviewedIndicator, { backgroundColor: colors.primary }]} />
          )}
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.statusTime, { color: colors.textSecondary }]}>
            {item.statusTime || 'Just now'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyStatus = () => {
    const hasStatus = myStatus !== null;
    const statusUrl = myStatus?.statusUrl?.startsWith('http') 
      ? myStatus.statusUrl 
      : myStatus?.statusUrl 
        ? `${API_CONFIG.BASE_URL}${myStatus.statusUrl}` 
        : null;
    
    return (
      <TouchableOpacity
        style={[styles.myStatusItem, { borderBottomColor: colors.divider }]}
        onPress={hasStatus ? () => handleStatusPress({ ...myStatus, name: 'My Status', email: userEmail }, 0) : handleAddStatus}
        onLongPress={hasStatus ? () => handleViewInfo({ ...myStatus, email: userEmail }) : null}
      >
        <View style={[styles.myStatusAvatar, { backgroundColor: colors.primary }]}>
          {hasStatus && statusUrl ? (
            <Image source={{ uri: statusUrl }} style={styles.myStatusAvatarImage} />
          ) : (
            <Text style={[styles.myStatusAvatarText, { color: colors.white }]}>
              {userEmail?.split('@')[0]?.charAt(0).toUpperCase() || '+'}
            </Text>
          )}
          <View style={[styles.addStatusButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.addStatusIcon}>{hasStatus ? 'ℹ️' : '+'}</Text>
          </View>
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusName, { color: colors.text }]}>My Status</Text>
          <Text style={[styles.statusTime, { color: colors.textSecondary }]}>
            {hasStatus ? (myStatus.statusTime || 'Just now') : 'Tap to add status update'}
          </Text>
        </View>
        {hasStatus && (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => handleViewInfo({ ...myStatus, email: userEmail })}
          >
            <Text style={[styles.infoButtonText, { color: colors.primary }]}>ℹ️</Text>
          </TouchableOpacity>
        )}
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
        keyExtractor={(item, index) => `status-${item.email || index}`}
        ListHeaderComponent={renderMyStatus}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No status updates
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Your contacts haven't shared any status updates yet
            </Text>
          </View>
        }
      />

      {/* Status Viewer Modal */}
      <Modal
        visible={showStatusViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusViewer(false)}
      >
        <View style={styles.statusViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStatusViewer(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {selectedStatus && (
            <StatusContentView status={selectedStatus} />
          )}
        </View>
      </Modal>

      {/* Viewers Modal */}
      <Modal
        visible={showViewersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.viewersModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Status Info</Text>
              <TouchableOpacity
                onPress={() => setShowViewersModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingViewers ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.viewersList}>
                <Text style={[styles.viewersCount, { color: colors.textSecondary }]}>
                  {viewers.length} {viewers.length === 1 ? 'viewer' : 'viewers'}
                </Text>
                {viewers.length === 0 ? (
                  <Text style={[styles.noViewers, { color: colors.textSecondary }]}>
                    No one has viewed this status yet
                  </Text>
                ) : (
                  <FlatList
                    data={viewers}
                    keyExtractor={(item, index) => `viewer-${item.viewerEmail}-${index}`}
                    renderItem={({ item }) => (
                      <View style={[styles.viewerItem, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.viewerAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.viewerAvatarText, { color: colors.white }]}>
                            {item.viewerName?.charAt(0).toUpperCase() || item.viewerEmail?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.viewerInfo}>
                          <Text style={[styles.viewerName, { color: colors.text }]}>
                            {item.viewerName || item.viewerEmail?.split('@')[0]}
                          </Text>
                          <Text style={[styles.viewerTime, { color: colors.textSecondary }]}>
                            {new Date(item.viewedAt).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  myStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  statusAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statusAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  unviewedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  myStatusAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  myStatusAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  addStatusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  addStatusIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  statusTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  viewersModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  viewersList: {
    flex: 1,
    padding: SPACING.md,
  },
  viewersCount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.md,
  },
  noViewers: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  viewerAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  viewerTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  infoButton: {
    padding: SPACING.sm,
  },
  infoButtonText: {
    fontSize: 20,
  },
  myStatusAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

export default StatusFeed;

