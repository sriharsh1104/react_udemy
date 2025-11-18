import { useCallback } from 'react';
import statusService from '../../../../services/statusService';
import fileUploadService from '../../../../services/fileUploadService';
import socketService from '../../../../services/socketService';
import encryptionService from '../../../../services/encryptionService';
import { SOCKET_EVENTS } from '../../../../constants';

export const useStatusHandlers = ({
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
}) => {
  const handleSaveImage = useCallback(async (currentStatus) => {
    if (!currentStatus || currentStatus.statusType !== 'image') {
      showAlert('Info', 'Only images can be saved', { type: 'info' });
      return;
    }

    try {
      const result = await statusService.saveImage(
        currentStatus.fileId,
        `status_${Date.now()}.jpg`,
        currentStatus.statusUrl
      );
      
      if (result.success) {
        showAlert('Success', 'Image saved successfully', { type: 'success' });
      } else {
        showAlert('Error', result.message || 'Failed to save image', { type: 'error' });
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showAlert('Error', 'Failed to save image', { type: 'error' });
    }
  }, [showAlert]);

  const handleForwardStatus = useCallback((currentStatus) => {
    if (!currentStatus) return;
    setStatusToForward(currentStatus);
    setShowForwardModal(true);
  }, [setStatusToForward, setShowForwardModal]);

  const handleForwardConfirm = useCallback(async (statusToForward, targets) => {
    if (!statusToForward || !targets || targets.length === 0) return;
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      const statusMessage = JSON.stringify({
        type: 'file',
        fileId: statusToForward.fileId,
        fileName: `status_${Date.now()}.${statusToForward.statusType === 'image' ? 'jpg' : 'mp4'}`,
        fileType: statusToForward.statusType,
        statusForward: true,
      });
      
      for (const target of targets) {
        try {
          if (target.type === 'private' && target.contactEmail) {
            const encryptedData = await encryptionService.encryptPrivateMessage(
              statusMessage,
              userEmail,
              target.contactEmail
            );
            socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
              message: JSON.stringify(encryptedData),
              contactEmail: target.contactEmail,
              senderEmail: userEmail,
            });
            successCount++;
          } else if (target.type === 'group' && target.groupId) {
            socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
              message: statusMessage,
              groupId: target.groupId,
              senderEmail: userEmail,
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error forwarding to ${target.type === 'private' ? target.contactEmail : target.groupName}:`, error);
          errorCount++;
        }
      }
      
      setShowForwardModal(false);
      setStatusToForward(null);
      
      if (errorCount === 0) {
        showAlert('Success', `Status forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'} successfully`, { type: 'success' });
      } else {
        showAlert('Partial Success', `Status forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'}, ${errorCount} ${errorCount === 1 ? 'failed' : 'failed'}`, { type: 'warning' });
      }
    } catch (error) {
      console.error('Error forwarding status:', error);
      showAlert('Error', 'Failed to forward status', { type: 'error' });
    }
  }, [userEmail, showAlert, setShowForwardModal, setStatusToForward]);

  const handleDeleteStatus = useCallback(async (statusId) => {
    if (!statusId) return;
    
    try {
      const result = await statusService.deleteStatus(statusId);
      if (result.success) {
        setShowDeleteConfirm(false);
        setStatusToDelete(null);
        setShowStatusViewer(false);
        setCurrentStatuses([]);
        setSelectedStatusIndex(0);
        await loadStatuses();
      } else {
        showAlert('Error', result.message || 'Failed to delete status', { type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      showAlert('Error', 'Failed to delete status', { type: 'error' });
    }
  }, [showAlert, loadStatuses, setShowDeleteConfirm, setStatusToDelete, setShowStatusViewer, setCurrentStatuses, setSelectedStatusIndex]);

  return {
    handleSaveImage,
    handleForwardStatus,
    handleForwardConfirm,
    handleDeleteStatus,
  };
};

