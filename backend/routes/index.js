const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const contactsController = require('../controllers/contactsController');
const settingsController = require('../controllers/settingsController');

const router = require('express').Router();

// Helper to wrap async handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/health', healthController.getHealth);

// Auth routes
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
router.delete('/contacts', asyncHandler(contactsController.removeContact.bind(contactsController)));
router.post('/contacts/mark-read', asyncHandler(contactsController.markMessagesAsRead.bind(contactsController)));
router.get('/contacts/invite-link', asyncHandler(contactsController.generateInviteLink.bind(contactsController)));

// Settings routes
router.post('/settings/set-password', asyncHandler(settingsController.setPassword.bind(settingsController)));
router.post('/settings/change-password', asyncHandler(settingsController.changePassword.bind(settingsController)));
router.get('/settings/password-status', asyncHandler(settingsController.checkPasswordStatus.bind(settingsController)));

console.log('Routes registered:');
console.log('  POST /api/auth/send-otp');
console.log('  POST /api/auth/verify-otp');
console.log('  POST /api/auth/login-password');
console.log('  POST /api/auth/forget-password');
console.log('  POST /api/auth/reset-password');
console.log('  POST /api/auth/logout');
console.log('  GET /api/profile');
console.log('  PUT /api/profile');
console.log('  POST /api/profile');
console.log('  GET /api/contacts/search');
console.log('  GET /api/contacts/check');
console.log('  GET /api/contacts');
console.log('  POST /api/contacts');
console.log('  DELETE /api/contacts');
console.log('  POST /api/contacts/mark-read');
console.log('  GET /api/contacts/invite-link');
console.log('  POST /api/settings/set-password');
console.log('  POST /api/settings/change-password');
console.log('  GET /api/settings/password-status');

module.exports = router;

