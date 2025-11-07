const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');

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

console.log('Routes registered: GET /profile, PUT /profile, POST /profile');

module.exports = router;

