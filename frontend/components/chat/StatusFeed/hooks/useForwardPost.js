import { useCallback } from 'react';
import socketService from '../../../../services/socketService';
import encryptionService from '../../../../services/encryptionService';
import { SOCKET_EVENTS } from '../../../../constants';
import logger from '../../../../utils/logger';

export const useForwardPost = ({ userEmail, showAlert }) => {
  const handleForwardPost = useCallback(async (selectedPost, targets) => {
    if (!selectedPost || !targets || targets.length === 0) return;
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      const forwardToTarget = async (target) => {
        try {
          const fileMessage = JSON.stringify({
            type: 'file',
            fileId: selectedPost.fileId,
            fileName: selectedPost.statusType === 'video' ? 'post_video.mp4' : 'post_image.jpg',
            fileType: selectedPost.statusType,
            fileSize: 0,
          });
          
          if (target.type === 'private' && target.contactEmail) {
            const encryptedData = await encryptionService.encryptPrivateMessage(
              fileMessage,
              userEmail,
              target.contactEmail
            );
            socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
              message: JSON.stringify(encryptedData),
              contactEmail: target.contactEmail,
              senderEmail: userEmail,
            });
            
            if (selectedPost.caption && selectedPost.caption.trim()) {
              const captionEncrypted = await encryptionService.encryptPrivateMessage(
                selectedPost.caption.trim(),
                userEmail,
                target.contactEmail
              );
              socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                message: JSON.stringify(captionEncrypted),
                contactEmail: target.contactEmail,
                senderEmail: userEmail,
              });
            }
            successCount++;
          } else if (target.type === 'group' && target.groupId) {
            socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
              message: fileMessage,
              groupId: target.groupId,
              senderEmail: userEmail,
            });
            
            if (selectedPost.caption && selectedPost.caption.trim()) {
              socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                message: selectedPost.caption.trim(),
                groupId: target.groupId,
                senderEmail: userEmail,
              });
            }
            successCount++;
          }
        } catch (error) {
          logger.error(`Error forwarding post to ${target.type === 'private' ? target.contactEmail : target.groupName}:`, error);
          errorCount++;
        }
      };
      
      await Promise.all(targets.map(target => forwardToTarget(target)));
      
      if (errorCount === 0) {
        showAlert('Success', `Post forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'} successfully`, { type: 'success' });
      } else {
        showAlert(
          'Partial Success', 
          `Post forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'}, ${errorCount} ${errorCount === 1 ? 'failed' : 'failed'}`,
          { type: 'warning' }
        );
      }
      
      return { success: true, successCount, errorCount };
    } catch (error) {
      logger.error('Error forwarding post:', error);
      showAlert('Error', 'Failed to forward post', { type: 'error' });
      return { success: false };
    }
  }, [userEmail, showAlert]);

  return { handleForwardPost };
};

