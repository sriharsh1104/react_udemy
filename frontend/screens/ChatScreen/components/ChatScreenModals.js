/**
 * ChatScreenModals - Extracted modals component
 * Contains all modal components used in ChatScreen to reduce main file size
 */

import React from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import AlertModal from '../../../components/common/AlertModal';
import CallHistory from '../../../components/call/CallHistory';
import PermissionPrompt from '../../../components/call/PermissionPrompt';
import BillSplitModal from '../../../components/chat/BillSplitModal';
import BillSummaryModal from '../../../components/chat/BillSummaryModal';
import GroupInfoModal from '../../../components/chat/GroupInfoModal';
import ContactInfoModal from '../../../components/chat/ContactInfoModal';
import MessageActionMenu from '../../../components/chat/MessageActionMenu';
import MessageInfoModal from '../../../components/chat/MessageInfoModal';
import ForwardContactModal from '../../../components/chat/ForwardContactModal';
import billSplitService from '../../../services/billSplitService';
import fileUploadService from '../../../services/fileUploadService';
import encryptionService from '../../../services/encryptionService';
import socketService from '../../../services/socketService';
import { SOCKET_EVENTS } from '../../../constants';
import logger from '../../../utils/logger';

const ChatScreenModals = ({
  // Modal visibility states
  showClearChatModal,
  showDeleteMessageModal,
  showCallHistory,
  showPermissionPrompt,
  showBillSplitModal,
  showBillSummaryModal,
  showGroupInfoModal,
  showContactInfoModal,
  showMessageMenu,
  showMessageInfoModal,
  showForwardModal,
  alertModal,
  
  // Modal data
  messageToDelete,
  forwardMessage,
  messageInfoMessageId,
  selectedMessage,
  currentGroup,
  
  // Chat state
  chatType,
  contactEmail,
  groupId,
  userEmail,
  contactName,
  privateMessages,
  
  // Handlers
  handleClearChatConfirm,
  setShowClearChatModal,
  chatHandlers,
  callHandlers,
  contactHandlers,
  handleClearChat,
  setShowCallHistory,
  handlePermissionRetry,
  handlePermissionCancel,
  permissionDeviceType,
  setShowBillSplitModal,
  setShowBillSummaryModal,
  setShowGroupInfoModal,
  setShowContactInfoModal,
  setShowMessageMenu,
  setSelectedMessage,
  setShowMessageInfoModal,
  setMessageInfoMessageId,
  setShowForwardModal,
  setForwardMessage,
  loadMessageInfo,
  showAlert,
  hideAlert,
}) => {
  return (
    <>
      <ConfirmationModal
        visible={showClearChatModal}
        title="Clear Chat"
        message="Are you sure you want to clear all messages in this chat? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleClearChatConfirm}
        onCancel={() => setShowClearChatModal(false)}
        confirmButtonStyle="destructive"
      />

      <ConfirmationModal
        visible={showDeleteMessageModal}
        title={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "Undo Message" 
          : "Delete Message"}
        message={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "This message hasn't been sent to the server yet. Remove it?"
          : "Are you sure you want to delete this message? This will show 'This message is deleted' to all users."}
        confirmText={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "Undo"
          : "Delete"}
        cancelText="Cancel"
        onConfirm={chatHandlers.handleDeleteMessageConfirm}
        onCancel={chatHandlers.handleDeleteMessageCancel}
        confirmButtonStyle="destructive"
      />

      <CallHistory
        visible={showCallHistory}
        onClose={() => setShowCallHistory(false)}
        userEmail={userEmail}
        contactEmail={contactEmail}
        groupId={groupId}
        isGroup={chatType === 'group'}
        onCallPress={callHandlers.handleCallFromHistory}
      />

      <PermissionPrompt
        visible={showPermissionPrompt}
        deviceType={permissionDeviceType}
        onRetry={handlePermissionRetry}
        onCancel={handlePermissionCancel}
      />

      {chatType && (
        <BillSplitModal
          visible={showBillSplitModal}
          onClose={() => setShowBillSplitModal(false)}
          onCreateBill={async (billData) => {
            try {
              const result = await billSplitService.createBillSplit({
                ...billData,
                contactEmail: chatType === 'private' ? contactEmail : null,
                groupId: chatType === 'group' ? groupId : null,
              });
              
              if (result.success) {
                setShowBillSplitModal(false);
              }
            } catch (error) {
              logger.error('Error creating bill split:', error);
              showAlert('Error', 'Failed to create bill split', 'error');
            }
          }}
          userEmail={userEmail}
          contactEmail={contactEmail}
          groupId={groupId}
          groupMembers={currentGroup?.members || []}
        />
      )}

      {chatType && (
        <BillSummaryModal
          visible={showBillSummaryModal}
          onClose={() => setShowBillSummaryModal(false)}
          userEmail={userEmail}
          contactEmail={contactEmail}
          groupId={groupId}
          roomId={chatType === 'group' 
            ? `group_${groupId}` 
            : (() => {
                const sorted = [userEmail, contactEmail].sort();
                return `chat_${sorted[0]}_${sorted[1]}`;
              })()}
          groupMembers={currentGroup?.members || []}
        />
      )}

      {currentGroup && (
        <GroupInfoModal
          visible={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          group={currentGroup}
          userEmail={userEmail}
          onGroupUpdated={contactHandlers.handleGroupUpdated}
          onExitGroup={contactHandlers.handleExitGroup}
          onClearChat={handleClearChat}
        />
      )}

      {chatType === 'private' && contactEmail && (
        <ContactInfoModal
          visible={showContactInfoModal}
          onClose={() => setShowContactInfoModal(false)}
          contactEmail={contactEmail}
          userEmail={userEmail}
          contactName={contactName}
          onSelectGroup={contactHandlers.handleSelectGroup}
          messages={privateMessages}
          onClearChat={handleClearChat}
        />
      )}

      <MessageActionMenu
        visible={showMessageMenu}
        onClose={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage?.message || ''}
        messageId={selectedMessage?.messageId || null}
        isSent={selectedMessage?.isSent || false}
        isPinned={selectedMessage?.isPinned || false}
        isCreator={selectedMessage?.isCreator || false}
        isGroup={selectedMessage?.isGroup || false}
        onDelete={chatHandlers.handleDeleteMessage}
        onForward={() => {
          setForwardMessage(selectedMessage);
          setShowForwardModal(true);
          setShowMessageMenu(false);
        }}
        onReply={chatHandlers.handleReplyMessage}
        onPin={() => selectedMessage?.messageId && chatHandlers.handlePinMessage(selectedMessage.messageId)}
        onUnpin={() => selectedMessage?.messageId && chatHandlers.handleUnpinMessage(selectedMessage.messageId)}
        onCopy={chatHandlers.handleCopyMessage}
        onInfo={chatHandlers.handleInfoMessage}
        onEdit={chatHandlers.handleEditMessage}
        canEdit={selectedMessage && (() => {
          const msg = selectedMessage;
          if (!msg.isSent) return false;
          if (msg.isDeleted) return false;
          
          // Check if message is a file message - file messages cannot be edited
          try {
            const messageStr = typeof msg.message === 'string' 
              ? msg.message 
              : (msg.message?.message || msg.message?.text || String(msg.message || ''));
            const parsed = JSON.parse(messageStr);
            if (parsed && parsed.type === 'file') {
              return false; // File messages cannot be edited
            }
          } catch {
            // Not a JSON message, proceed with normal check
          }
          
          if (chatType === 'private') {
            return msg.status !== 'read';
          }
          if (chatType === 'group' && currentGroup) {
            if (msg.status === 'read') return false;
            const readByOthers = (msg.readBy || []).filter(email => email !== userEmail);
            return readByOthers.length === 0;
          }
          return false;
        })()}
      />

      <MessageInfoModal
        visible={showMessageInfoModal}
        onClose={() => {
          setShowMessageInfoModal(false);
          setMessageInfoMessageId(null);
        }}
        messageId={messageInfoMessageId}
        chatType={chatType}
        userEmail={userEmail}
        onLoadMessageInfo={loadMessageInfo}
      />

      <ForwardContactModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setForwardMessage(null);
        }}
        onSelectContacts={async (targets) => {
          if (!forwardMessage || !targets || targets.length === 0) return;
          
          try {
            const messageToForward = forwardMessage.message;
            let successCount = 0;
            let errorCount = 0;
            
            // Helper function to forward message to a single target
            const forwardToTarget = async (target) => {
              try {
                // Check if it's a file message
                try {
                  const parsed = JSON.parse(messageToForward);
                  if (parsed && parsed.type === 'file') {
                    // Check if file exists locally
                    const localUri = await fileUploadService.getLocalFileUri(parsed.fileId, parsed.fileName);
                    
                    if (localUri) {
                      // File exists locally, re-upload from cache
                      const uploadResult = await fileUploadService.uploadFileFromLocal(
                        localUri,
                        parsed.fileName,
                        parsed.fileType,
                        userEmail
                      );
                      
                      if (uploadResult.success && uploadResult.fileId) {
                        const fileMessage = JSON.stringify({
                          type: 'file',
                          fileId: uploadResult.fileId,
                          fileName: uploadResult.fileName || parsed.fileName,
                          fileType: uploadResult.fileType || parsed.fileType,
                          fileSize: uploadResult.fileSize || parsed.fileSize || 0,
                          localUri: uploadResult.localUri || null,
                        });
                        
                        // Send to selected contact/group
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
                          successCount++;
                        } else if (target.type === 'group' && target.groupId) {
                          socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                            message: fileMessage,
                            groupId: target.groupId,
                            senderEmail: userEmail,
                          });
                          successCount++;
                        }
                      } else {
                        errorCount++;
                      }
                    } else {
                      // File doesn't exist locally, forward the fileId (receiver will download)
                      if (target.type === 'private' && target.contactEmail) {
                        const encryptedData = await encryptionService.encryptPrivateMessage(
                          messageToForward,
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
                          message: messageToForward,
                          groupId: target.groupId,
                          senderEmail: userEmail,
                        });
                        successCount++;
                      }
                    }
                  } else {
                    // Regular text message
                    if (target.type === 'private' && target.contactEmail) {
                      const encryptedData = await encryptionService.encryptPrivateMessage(
                        messageToForward,
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
                        message: messageToForward,
                        groupId: target.groupId,
                        senderEmail: userEmail,
                      });
                      successCount++;
                    }
                  }
                } catch {
                  // Not JSON, treat as regular text
                  if (target.type === 'private' && target.contactEmail) {
                    const encryptedData = await encryptionService.encryptPrivateMessage(
                      messageToForward,
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
                      message: messageToForward,
                      groupId: target.groupId,
                      senderEmail: userEmail,
                    });
                    successCount++;
                  }
                }
              } catch (error) {
                logger.error(`Error forwarding to ${target.type === 'private' ? target.contactEmail : target.groupName}:`, error);
                errorCount++;
              }
            };
            
            // Forward to all selected targets
            await Promise.all(targets.map(target => forwardToTarget(target)));
            
            setShowForwardModal(false);
            setForwardMessage(null);
            
            if (errorCount === 0) {
              showAlert('Success', `Message forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'} successfully`, 'success');
            } else {
              showAlert(
                'Partial Success', 
                `Message forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'}, ${errorCount} ${errorCount === 1 ? 'failed' : 'failed'}`,
                'warning'
              );
            }
          } catch (error) {
            logger.error('Error forwarding message:', error);
            showAlert('Error', 'Failed to forward message', 'error');
          }
        }}
        message={forwardMessage?.message || ''}
      />

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={hideAlert}
      />
    </>
  );
};

ChatScreenModals.propTypes = {
  showClearChatModal: PropTypes.bool.isRequired,
  showDeleteMessageModal: PropTypes.bool.isRequired,
  showCallHistory: PropTypes.bool.isRequired,
  showPermissionPrompt: PropTypes.bool.isRequired,
  showBillSplitModal: PropTypes.bool.isRequired,
  showBillSummaryModal: PropTypes.bool.isRequired,
  showGroupInfoModal: PropTypes.bool.isRequired,
  showContactInfoModal: PropTypes.bool.isRequired,
  showMessageMenu: PropTypes.bool.isRequired,
  showMessageInfoModal: PropTypes.bool.isRequired,
  showForwardModal: PropTypes.bool.isRequired,
  alertModal: PropTypes.object.isRequired,
  messageToDelete: PropTypes.object,
  forwardMessage: PropTypes.object,
  messageInfoMessageId: PropTypes.string,
  selectedMessage: PropTypes.object,
  currentGroup: PropTypes.object,
  chatType: PropTypes.string,
  contactEmail: PropTypes.string,
  groupId: PropTypes.string,
  userEmail: PropTypes.string.isRequired,
  contactName: PropTypes.string,
  privateMessages: PropTypes.array.isRequired,
  handleClearChatConfirm: PropTypes.func.isRequired,
  setShowClearChatModal: PropTypes.func.isRequired,
  chatHandlers: PropTypes.object.isRequired,
  callHandlers: PropTypes.object.isRequired,
  contactHandlers: PropTypes.object.isRequired,
  handleClearChat: PropTypes.func.isRequired,
  setShowCallHistory: PropTypes.func.isRequired,
  handlePermissionRetry: PropTypes.func.isRequired,
  handlePermissionCancel: PropTypes.func.isRequired,
  permissionDeviceType: PropTypes.string,
  setShowBillSplitModal: PropTypes.func.isRequired,
  setShowBillSummaryModal: PropTypes.func.isRequired,
  setShowGroupInfoModal: PropTypes.func.isRequired,
  setShowContactInfoModal: PropTypes.func.isRequired,
  setShowMessageMenu: PropTypes.func.isRequired,
  setSelectedMessage: PropTypes.func.isRequired,
  setShowMessageInfoModal: PropTypes.func.isRequired,
  setMessageInfoMessageId: PropTypes.func.isRequired,
  setShowForwardModal: PropTypes.func.isRequired,
  setForwardMessage: PropTypes.func.isRequired,
  loadMessageInfo: PropTypes.func.isRequired,
  showAlert: PropTypes.func.isRequired,
  hideAlert: PropTypes.func.isRequired,
};

export default ChatScreenModals;

