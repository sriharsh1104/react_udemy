const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const contactsController = require('../controllers/contactsController');
const settingsController = require('../controllers/settingsController');
const groupController = require('../controllers/groupController');
const fileController = require('../controllers/fileController');
const statusController = require('../controllers/statusController');
const feedController = require('../controllers/feedController');

const router = require('express').Router();

// Helper to wrap async handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/health', healthController.getHealth);

// Auth routes
router.post('/auth/register', asyncHandler(authController.register.bind(authController)));
router.post('/auth/send-otp', asyncHandler(authController.sendOTP.bind(authController)));
router.post('/auth/verify-otp', asyncHandler(authController.verifyOTP.bind(authController)));
router.post('/auth/login-password', asyncHandler(authController.loginWithPassword.bind(authController)));
router.post('/auth/forget-password', asyncHandler(authController.forgetPassword.bind(authController)));
router.post('/auth/reset-password', asyncHandler(authController.resetPassword.bind(authController)));
router.post('/auth/logout', asyncHandler(authController.logout.bind(authController)));

// Profile routes - Direct function call
router.get('/profile', asyncHandler(async (req, res) => {
  await profileController.getProfile(req, res);
}));

router.post('/profile/contact', asyncHandler(async (req, res) => {
  await profileController.getContactProfile(req, res);
}));

router.put('/profile', asyncHandler(async (req, res) => {
  await profileController.updateProfile(req, res);
}));

router.post('/profile', asyncHandler(async (req, res) => {
  await profileController.updateProfile(req, res);
}));

// Contacts routes
router.get('/contacts/search', asyncHandler(contactsController.searchUsers.bind(contactsController)));
router.post('/contacts/check', asyncHandler(contactsController.checkUserExists.bind(contactsController)));
router.get('/contacts/check-phone', asyncHandler(contactsController.checkPhoneRegistered.bind(contactsController)));
router.post('/contacts/check-phones-batch', asyncHandler(contactsController.checkPhonesBatch.bind(contactsController)));
router.get('/contacts', asyncHandler(contactsController.getContacts.bind(contactsController)));
router.get('/contacts/recent-chats', asyncHandler(contactsController.getRecentChats.bind(contactsController)));
router.post('/contacts', asyncHandler(contactsController.addContact.bind(contactsController)));
router.post('/contacts/toggle-favorite', asyncHandler(contactsController.toggleFavorite.bind(contactsController)));
router.delete('/contacts', asyncHandler(contactsController.removeContact.bind(contactsController)));
router.post('/contacts/mark-read', asyncHandler(contactsController.markMessagesAsRead.bind(contactsController)));
router.get('/contacts/invite-link', asyncHandler(contactsController.generateInviteLink.bind(contactsController)));
router.post('/contacts/delete-message', asyncHandler(contactsController.deleteMessage.bind(contactsController)));
router.post('/contacts/edit-message', asyncHandler(contactsController.editMessage.bind(contactsController)));
router.post('/contacts/clear-chat', asyncHandler(contactsController.clearChat.bind(contactsController)));
router.post('/contacts/delete-chat', asyncHandler(contactsController.deleteChat.bind(contactsController)));
router.get('/contacts/message-info/:messageId', asyncHandler(contactsController.getMessageInfo.bind(contactsController)));
router.post('/contacts/toggle-pin', asyncHandler(contactsController.togglePin.bind(contactsController)));
router.post('/contacts/toggle-archive', asyncHandler(contactsController.toggleArchive.bind(contactsController)));
router.post('/contacts/toggle-mute', asyncHandler(contactsController.toggleMute.bind(contactsController)));
router.post('/contacts/delete', asyncHandler(contactsController.deleteContact.bind(contactsController)));

// Settings routes
router.post('/settings/set-password', asyncHandler(settingsController.setPassword.bind(settingsController)));
router.post('/settings/change-password', asyncHandler(settingsController.changePassword.bind(settingsController)));
router.get('/settings/password-status', asyncHandler(settingsController.checkPasswordStatus.bind(settingsController)));
router.get('/settings/offline-mode', asyncHandler(settingsController.getOfflineMode.bind(settingsController)));
router.post('/settings/offline-mode', asyncHandler(settingsController.toggleOfflineMode.bind(settingsController)));

// Group routes
router.post('/groups', asyncHandler(groupController.createGroup.bind(groupController)));
router.get('/groups', asyncHandler(groupController.getGroups.bind(groupController)));
router.get('/groups/:groupId', asyncHandler(groupController.getGroup.bind(groupController)));
router.post('/groups/add-members', asyncHandler(groupController.addMembers.bind(groupController)));
router.post('/groups/remove-member', asyncHandler(groupController.removeMember.bind(groupController)));
router.put('/groups/update-name', asyncHandler(groupController.updateGroupName.bind(groupController)));
router.post('/groups/toggle-favorite', asyncHandler(groupController.toggleFavorite.bind(groupController)));
router.post('/groups/mark-read', asyncHandler(groupController.markGroupMessagesAsRead.bind(groupController)));
router.delete('/groups', asyncHandler(groupController.deleteGroup.bind(groupController)));
router.post('/groups/generate-invite-link', asyncHandler(groupController.generateInviteLink.bind(groupController)));
router.post('/groups/reset-invite-link', asyncHandler(groupController.resetInviteLink.bind(groupController)));
router.post('/groups/join-via-link', asyncHandler(groupController.joinGroupViaLink.bind(groupController)));
router.get('/groups/invite/:inviteToken', asyncHandler(groupController.getGroupByInviteToken.bind(groupController)));
router.post('/groups/pin-message', asyncHandler(groupController.pinMessage.bind(groupController)));
router.post('/groups/unpin-message', asyncHandler(groupController.unpinMessage.bind(groupController)));
router.get('/groups/:groupId/pinned-messages', asyncHandler(groupController.getPinnedMessages.bind(groupController)));
router.post('/groups/delete-message', asyncHandler(groupController.deleteMessage.bind(groupController)));
router.post('/groups/edit-message', asyncHandler(groupController.editMessage.bind(groupController)));
router.post('/groups/clear-chat', asyncHandler(groupController.clearChat.bind(groupController)));
router.get('/groups/message-info/:messageId', asyncHandler(groupController.getMessageInfo.bind(groupController)));
router.post('/groups/toggle-pin', asyncHandler(groupController.togglePin.bind(groupController)));
router.post('/groups/toggle-archive', asyncHandler(groupController.toggleArchive.bind(groupController)));
router.post('/groups/toggle-mute', asyncHandler(groupController.toggleMute.bind(groupController)));

// File routes
router.post('/files/upload', fileController.uploadFile);
router.get('/files/download/:fileId', fileController.downloadFile);
router.delete('/files/delete/:fileId', fileController.deleteFile);

// Status routes
router.post('/status/upload', statusController.uploadStatus);
router.get('/status/feed', statusController.getStatusFeed);
router.post('/status/view', statusController.markAsViewed);
router.get('/status/:statusId/viewers', statusController.getViewers);

// Feed routes (Instagram-like feed)
router.get('/feed', feedController.getFeed);
router.post('/feed/like', feedController.toggleLike);
router.post('/feed/comment', feedController.addComment);
router.get('/feed/comments/:statusId', feedController.getComments);
router.post('/feed/caption', feedController.updateCaption);
router.get('/feed/search', feedController.searchProfiles);
router.post('/feed/profile', feedController.getProfile);
router.post('/feed/follow', feedController.followUser);
router.post('/feed/unfollow', feedController.unfollowUser);
router.post('/feed/accept-request', feedController.acceptFollowRequest);
router.post('/feed/reject-request', feedController.rejectFollowRequest);
router.get('/feed/pending-requests', feedController.getPendingRequests);

module.exports = router;

