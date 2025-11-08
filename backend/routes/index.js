const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const contactsController = require('../controllers/contactsController');
const settingsController = require('../controllers/settingsController');
const groupController = require('../controllers/groupController');
const fileController = require('../controllers/fileController');

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

router.get('/profile/:email', asyncHandler(async (req, res) => {
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
router.get('/contacts/check', asyncHandler(contactsController.checkUserExists.bind(contactsController)));
router.get('/contacts/check-phone', asyncHandler(contactsController.checkPhoneRegistered.bind(contactsController)));
router.post('/contacts/check-phones-batch', asyncHandler(contactsController.checkPhonesBatch.bind(contactsController)));
router.get('/contacts', asyncHandler(contactsController.getContacts.bind(contactsController)));
router.post('/contacts', asyncHandler(contactsController.addContact.bind(contactsController)));
router.post('/contacts/toggle-favorite', asyncHandler(contactsController.toggleFavorite.bind(contactsController)));
router.delete('/contacts', asyncHandler(contactsController.removeContact.bind(contactsController)));
router.post('/contacts/mark-read', asyncHandler(contactsController.markMessagesAsRead.bind(contactsController)));
router.get('/contacts/invite-link', asyncHandler(contactsController.generateInviteLink.bind(contactsController)));
router.post('/contacts/delete-message', asyncHandler(contactsController.deleteMessage.bind(contactsController)));
router.get('/contacts/message-info/:messageId', asyncHandler(contactsController.getMessageInfo.bind(contactsController)));
router.post('/contacts/toggle-pin', asyncHandler(contactsController.togglePin.bind(contactsController)));
router.post('/contacts/toggle-archive', asyncHandler(contactsController.toggleArchive.bind(contactsController)));
router.post('/contacts/toggle-mute', asyncHandler(contactsController.toggleMute.bind(contactsController)));
router.post('/contacts/delete', asyncHandler(contactsController.deleteContact.bind(contactsController)));

// Settings routes
router.post('/settings/set-password', asyncHandler(settingsController.setPassword.bind(settingsController)));
router.post('/settings/change-password', asyncHandler(settingsController.changePassword.bind(settingsController)));
router.get('/settings/password-status', asyncHandler(settingsController.checkPasswordStatus.bind(settingsController)));

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
router.get('/groups/message-info/:messageId', asyncHandler(groupController.getMessageInfo.bind(groupController)));
router.post('/groups/toggle-pin', asyncHandler(groupController.togglePin.bind(groupController)));
router.post('/groups/toggle-archive', asyncHandler(groupController.toggleArchive.bind(groupController)));
router.post('/groups/toggle-mute', asyncHandler(groupController.toggleMute.bind(groupController)));

// File routes
router.post('/files/upload', fileController.uploadFile);
router.get('/files/download/:fileId', fileController.downloadFile);
router.delete('/files/delete/:fileId', fileController.deleteFile);

console.log('Routes registered:');
console.log('  POST /api/auth/register');
console.log('  POST /api/auth/send-otp');
console.log('  POST /api/auth/verify-otp');
console.log('  POST /api/auth/login-password');
console.log('  POST /api/auth/forget-password');
console.log('  POST /api/auth/reset-password');
console.log('  POST /api/auth/logout');
console.log('  GET /api/profile');
console.log('  GET /api/profile/:email');
console.log('  PUT /api/profile');
console.log('  POST /api/profile');
console.log('  GET /api/contacts/search');
console.log('  GET /api/contacts/check');
console.log('  GET /api/contacts');
console.log('  POST /api/contacts');
console.log('  POST /api/contacts/toggle-favorite');
console.log('  DELETE /api/contacts');
console.log('  POST /api/contacts/mark-read');
console.log('  GET /api/contacts/invite-link');
console.log('  POST /api/settings/set-password');
console.log('  POST /api/settings/change-password');
console.log('  GET /api/settings/password-status');
console.log('  POST /api/groups');
console.log('  GET /api/groups');
console.log('  GET /api/groups/:groupId');
console.log('  POST /api/groups/add-members');
console.log('  POST /api/groups/remove-member');
console.log('  PUT /api/groups/update-name');
console.log('  DELETE /api/groups');

module.exports = router;

