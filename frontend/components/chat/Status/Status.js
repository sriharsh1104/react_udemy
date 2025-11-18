import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import statusService from '../../../services/statusService';
import fileUploadService from '../../../services/fileUploadService';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { API_CONFIG } from '../../../constants';
import AlertModal from '../../common/AlertModal/AlertModal';
import ActionModal from '../../common/ActionModal/ActionModal';
import useAlertModal from '../../../hooks/useAlertModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './Status.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive sizes
const getStatusItemWidth = () => {
  const padding = 16 * 2;
  const gaps = 16 * 3; // 3 gaps between 4 items
  return (SCREEN_WIDTH - padding - gaps) / 4;
};

const STATUS_AVATAR_SIZE = SCREEN_WIDTH < 360 ? 50 : 56;
const STATUS_AVATAR_RADIUS = STATUS_AVATAR_SIZE / 2;

// My Status Avatar Component
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
          // Fallback to statusUrl from backend
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
        {/* Add more status button (WhatsApp style) - always visible when status exists */}
        <TouchableOpacity
          style={[styles.addMoreStatusButton, { backgroundColor: colors.primary }]}
          onPress={onAddPress}
          activeOpacity={0.8}
        >
          <Text style={styles.addMoreStatusButtonText}>➕</Text>
        </TouchableOpacity>
        {/* Status count badge - show on top left if multiple statuses */}
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

// Status Content Viewer Component
const StatusContentView = ({ status, onClose, onNext, onPrev, currentIndex, totalStatuses }) => {
  const { colors } = useTheme();
  const [statusUrl, setStatusUrl] = useState(null);
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  
  // Load status URL with authentication token
  useEffect(() => {
    const loadStatusUrl = async () => {
      if (!status) return;
      
      // If fileId is available, use fileUploadService to get URL with token
      if (status.fileId) {
        try {
          const url = await fileUploadService.getFileViewUrl(status.fileId);
          setStatusUrl(url);
        } catch (error) {
          console.error('Error loading status URL:', error);
          // Fallback to statusUrl from backend
          const fallbackUrl = status.statusUrl?.startsWith('http') 
    ? status.statusUrl 
            : status.statusUrl 
      ? `${API_CONFIG.BASE_URL}${status.statusUrl}` 
      : null;
          setStatusUrl(fallbackUrl);
        }
      } else if (status.statusUrl) {
        // Fallback: construct URL manually with token
        const baseUrl = status.statusUrl.startsWith('http') 
          ? status.statusUrl 
          : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
        
        // Add token as query param for authentication
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

const Status = ({ userEmail, contacts = [] }) => {
  const { colors } = useTheme();
  const { showAlert, showAction, alertState, actionState, hideAlert, hideAction } = useAlertModal();
  const [statuses, setStatuses] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [currentStatuses, setCurrentStatuses] = useState([]);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [selectedStatusIdForViewers, setSelectedStatusIdForViewers] = useState(null);
  const [viewedStatusIds, setViewedStatusIds] = useState(new Set()); // Track viewed statuses in current session

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
        
        // Track already viewed statuses from backend
        const viewedSet = new Set();
        result.statuses?.forEach(contact => {
          if (contact.allStatuses) {
            contact.allStatuses.forEach(status => {
              if (status.isViewed && status.statusId) {
                viewedSet.add(status.statusId);
              }
            });
          } else if (contact.isViewed && contact.statusId) {
            viewedSet.add(contact.statusId);
          }
        });
        
        // Also track own statuses if viewed
        if (result.myStatus?.allStatuses) {
          result.myStatus.allStatuses.forEach(status => {
            if (status.isViewed && status.statusId) {
              viewedSet.add(status.statusId);
            }
          });
        }
        
        setViewedStatusIds(viewedSet);
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
          showAlert('Permission Denied', 'We need camera roll permissions to add status', { type: 'warning' });
          return;
        }
      }

      showAction(
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
      showAlert('Error', 'Failed to add status', { type: 'error' });
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
        showAlert('Permission Denied', 'We need camera roll permissions', { type: 'warning' });
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
      showAlert('Error', 'Failed to open gallery', { type: 'error' });
    }
  };

  const pickFromCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        showAlert('Not Available', 'Camera is not available on web. Please use Gallery option.', { type: 'info' });
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need camera permissions', { type: 'warning' });
        return;
      }

      showAction(
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
      showAlert('Error', 'Failed to open camera', { type: 'error' });
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
      showAlert('Error', 'Failed to take photo', { type: 'error' });
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
      showAlert('Error', 'Failed to take video', { type: 'error' });
    }
  };

  const uploadStatus = async (file, type) => {
    try {
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024;
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        showAlert('File Too Large', 'Image size must be less than 2MB', { type: 'warning' });
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        showAlert('File Too Large', 'Video size must be less than 5MB', { type: 'warning' });
        return;
      }
      
      setLoading(true);
      
      // Upload status update (postType='status' for WhatsApp-style, default)
      const result = await statusService.uploadStatus(file, type, '', [], 'status');
      
      if (result.success) {
        await loadStatuses();
      } else {
        showAlert('Upload Failed', result.message || 'Failed to upload status', { type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      showAlert('Error', 'Failed to upload status. Please try again.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusPress = async (contact) => {
    // Get all statuses for this contact (multiple statuses support)
    const allStatuses = contact.allStatuses || [{
      ...contact,
      email: contact.email,
      name: contact.name,
      statusTime: contact.statusTime,
      fileId: contact.fileId,
      statusId: contact.statusId,
      statusType: contact.statusType,
      viewersCount: contact.viewersCount || 0,
      isViewed: contact.isViewed || false, // Include isViewed flag
    }];

    // Set all statuses for viewing
    setCurrentStatuses(allStatuses);
    setSelectedStatusIndex(0);
    setSelectedContact(contact);
    setShowStatusViewer(true);

    // Mark first status as viewed (only if not already viewed)
    if (allStatuses.length > 0 && allStatuses[0].statusId) {
      const firstStatusId = allStatuses[0].statusId;
      const isAlreadyViewed = viewedStatusIds.has(firstStatusId) || allStatuses[0].isViewed;
      
      if (!isAlreadyViewed) {
        await statusService.markAsViewed(firstStatusId);
        // Track as viewed in current session
        setViewedStatusIds(prev => new Set(prev).add(firstStatusId));
        await loadStatuses();
      }
    }
  };

  const handleMyStatusPress = async () => {
    if (!myStatus) {
      handleAddStatus();
      return;
    }

    // Get all statuses for current user (multiple statuses support)
    const allStatuses = myStatus.allStatuses || [{
      ...myStatus,
      email: userEmail,
      name: userEmail.split('@')[0],
      statusTime: myStatus.statusTime,
      fileId: myStatus.fileId,
      statusId: myStatus.statusId,
      statusType: myStatus.statusType,
      viewersCount: myStatus.viewersCount || 0,
    }];

    // Set all statuses for viewing
    setCurrentStatuses(allStatuses);
    setSelectedStatusIndex(0);
    setSelectedContact(null);
    setShowStatusViewer(true);
  };

  const handleViewViewers = async (statusId) => {
    if (!statusId) return;
    
    setSelectedStatusIdForViewers(statusId);
    setShowViewersModal(true);
    setLoadingViewers(true);
    
    try {
      const result = await statusService.getViewers(statusId);
      if (result.success) {
        setViewersList(result.viewers || []);
      } else {
        showAlert('Error', result.message || 'Failed to load viewers', { type: 'error' });
      }
    } catch (error) {
      console.error('Error loading viewers:', error);
      showAlert('Error', 'Failed to load viewers', { type: 'error' });
    } finally {
      setLoadingViewers(false);
    }
  };

  // Status Item Component
  const StatusItem = ({ item, index, onPress }) => {
    const { colors } = useTheme();
    const [avatarUrl, setAvatarUrl] = useState(null);
    const hasUnviewed = item.hasUnviewedStatus;
    const borderColor = hasUnviewed ? colors.primary : colors.divider;
    const borderWidth = hasUnviewed ? 3 : 2;
    const itemWidth = getStatusItemWidth();
    const isLastInRow = (index + 1) % 4 === 0;

    // Load avatar image URL with authentication token
    useEffect(() => {
      const loadAvatarUrl = async () => {
        if (item.fileId) {
          try {
            const url = await fileUploadService.getFileViewUrl(item.fileId);
            setAvatarUrl(url);
          } catch (error) {
            console.error('Error loading avatar URL:', error);
            // Fallback to statusUrl from backend
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

  const renderStatusItem = ({ item, index }) => {
    return <StatusItem item={item} index={index} onPress={() => handleStatusPress(item)} />;
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
        contentContainerStyle={[styles.statusList, { alignItems: 'flex-start' }]}
        columnWrapperStyle={statuses.length > 0 ? styles.statusRow : null}
        style={{ alignSelf: 'flex-start', width: '100%' }}
        ListHeaderComponent={
          <View style={styles.myStatusHeader}>
            <TouchableOpacity
              style={[styles.myStatusItem, { width: getStatusItemWidth() }]}
              onPress={handleMyStatusPress}
              activeOpacity={0.7}
            >
              <View style={styles.myStatusContainer}>
                {myStatus?.fileId ? (
                  <MyStatusAvatar 
                    fileId={myStatus.fileId} 
                    statusUrl={myStatus.statusUrl} 
                    statusCount={myStatus.statusCount || (myStatus.allStatuses?.length || 1)}
                    onAddPress={handleAddStatus}
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
          {/* Top Right Buttons */}
          <View style={styles.topRightButtons}>
            {/* Viewers button - only show for own status */}
            {currentStatuses.length > 0 && 
             currentStatuses[selectedStatusIndex]?.email === userEmail && 
             currentStatuses[selectedStatusIndex]?.statusId && (
              <TouchableOpacity
                style={[styles.viewersIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => handleViewViewers(currentStatuses[selectedStatusIndex].statusId)}
              >
                <Text style={styles.viewersIconButtonText}>
                  👁️ {currentStatuses[selectedStatusIndex]?.viewersCount || 0}
                </Text>
              </TouchableOpacity>
            )}
            {/* Close button */}
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
          </View>
          
          {currentStatuses.length > 0 && (
            <StatusContentView
              status={currentStatuses[selectedStatusIndex]}
              onClose={() => {
                setShowStatusViewer(false);
                setCurrentStatuses([]);
                setSelectedStatusIndex(0);
              }}
              onNext={async () => {
                if (selectedStatusIndex < currentStatuses.length - 1) {
                  const nextIndex = selectedStatusIndex + 1;
                  setSelectedStatusIndex(nextIndex);
                  
                  // Mark next status as viewed when navigating to it (only if not already viewed)
                  const nextStatus = currentStatuses[nextIndex];
                  if (nextStatus?.statusId) {
                    const isAlreadyViewed = viewedStatusIds.has(nextStatus.statusId) || nextStatus.isViewed;
                    
                    if (!isAlreadyViewed) {
                      await statusService.markAsViewed(nextStatus.statusId);
                      // Track as viewed in current session
                      setViewedStatusIds(prev => new Set(prev).add(nextStatus.statusId));
                    }
                  }
                } else {
                  // If last status, close viewer
                  setShowStatusViewer(false);
                  setCurrentStatuses([]);
                  setSelectedStatusIndex(0);
                  await loadStatuses(); // Refresh to update viewed status
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />

      {/* Action Modal */}
      <ActionModal
        visible={actionState.visible}
        title={actionState.title}
        message={actionState.message}
        options={actionState.options}
        onClose={hideAction}
      />

      {/* Viewers Modal */}
      <Modal
        visible={showViewersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowViewersModal(false);
          setViewersList([]);
          setSelectedStatusIdForViewers(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.viewersModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Viewers</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowViewersModal(false);
                  setViewersList([]);
                  setSelectedStatusIdForViewers(null);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingViewers ? (
              <View style={styles.viewersLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={viewersList}
                keyExtractor={(item, index) => `viewer-${item.viewerEmail}-${index}`}
                style={styles.viewersList}
                renderItem={({ item }) => (
                  <View style={[styles.viewerItem, { borderBottomColor: colors.divider }]}>
                    <View style={[styles.viewerAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.viewerAvatarText, { color: colors.white }]}>
                        {item.viewerName?.charAt(0).toUpperCase() || 'U'}
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
                ListEmptyComponent={
                  <View style={styles.emptyViewersContainer}>
                    <Text style={[styles.emptyViewersText, { color: colors.textSecondary }]}>
                      No one has viewed this status yet
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Status;

