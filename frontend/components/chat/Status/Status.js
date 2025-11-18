import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import statusService from '../../../services/statusService';
import useAlertModal from '../../../hooks/useAlertModal';
import ForwardContactModal from '../ForwardContactModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import AlertModal from '../../common/AlertModal/AlertModal';
import ActionModal from '../../common/ActionModal/ActionModal';
import MyStatusAvatar from './components/MyStatusAvatar';
import StatusContentView from './components/StatusContentView';
import StatusItem from './components/StatusItem';
import { useStatusUpload } from './hooks/useStatusUpload';
import { useStatusHandlers } from './hooks/useStatusHandlers';
import styles from './Status.styles';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStatusItemWidth = () => {
  const padding = 16 * 2;
  const gaps = 16 * 3;
  return (SCREEN_WIDTH - padding - gaps) / 4;
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
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [statusToForward, setStatusToForward] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);

  // Define loadStatuses first using useCallback
  const loadStatuses = useCallback(async () => {
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
  }, [contacts, userEmail]);

  // Use hooks (after loadStatuses is defined)
  const { handleAddStatus } = useStatusUpload({
    loadStatuses,
    showAlert,
  });

  const {
    handleSaveImage,
    handleForwardStatus,
    handleForwardConfirm,
    handleDeleteStatus,
  } = useStatusHandlers({
    userEmail,
    showAlert,
    loadStatuses,
    setShowForwardModal,
    setStatusToForward,
    setShowDeleteConfirm,
    setStatusToDelete,
    setShowStatusViewer,
    setCurrentStatuses,
    setSelectedStatusIndex,
  });

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);


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

  const handleDeleteStatusConfirm = async () => {
    await handleDeleteStatus(statusToDelete);
  };

  const handleSaveImagePress = async () => {
    if (currentStatuses.length === 0) return;
    const currentStatus = currentStatuses[selectedStatusIndex];
    await handleSaveImage(currentStatus);
  };

  const handleForwardStatusPress = () => {
    if (currentStatuses.length === 0) return;
    const currentStatus = currentStatuses[selectedStatusIndex];
    handleForwardStatus(currentStatus);
  };

  const renderStatusItem = ({ item, index }) => {
    return (
      <StatusItem 
        item={item} 
        index={index} 
        onPress={() => handleStatusPress(item)} 
      />
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
            <>
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
              
              {/* Action Buttons - Bottom */}
              <View style={styles.statusActionButtons}>
                {/* Delete button - only for own status */}
                {currentStatuses[selectedStatusIndex]?.email === userEmail && (
                  <TouchableOpacity
                    style={[styles.statusActionButton, { backgroundColor: 'rgba(255, 59, 48, 0.8)' }]}
                    onPress={() => {
                      setStatusToDelete(currentStatuses[selectedStatusIndex]?.statusId);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Text style={styles.statusActionButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                )}
                
                {/* Save button - only for images */}
                {currentStatuses[selectedStatusIndex]?.statusType === 'image' && (
                  <TouchableOpacity
                    style={[styles.statusActionButton, { backgroundColor: 'rgba(52, 199, 89, 0.8)' }]}
                    onPress={handleSaveImagePress}
                  >
                    <Text style={styles.statusActionButtonText}>💾 Save</Text>
                  </TouchableOpacity>
                )}
                
                {/* Forward button - for all statuses */}
                <TouchableOpacity
                  style={[styles.statusActionButton, { backgroundColor: 'rgba(0, 122, 255, 0.8)' }]}
                  onPress={handleForwardStatusPress}
                >
                  <Text style={styles.statusActionButtonText}>➡️ Forward</Text>
                </TouchableOpacity>
              </View>
            </>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Status"
        message="Are you sure you want to delete this status? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteStatusConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setStatusToDelete(null);
        }}
        confirmButtonStyle="destructive"
      />

      {/* Forward Modal */}
      <ForwardContactModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setStatusToForward(null);
        }}
        onSelectContacts={(targets) => handleForwardConfirm(statusToForward, targets)}
        message={statusToForward ? `Forwarding ${statusToForward.statusType === 'image' ? 'image' : 'video'} status` : ''}
      />
    </View>
  );
};

export default Status;

