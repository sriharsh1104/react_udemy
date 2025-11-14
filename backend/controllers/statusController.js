const statusService = require('../services/statusService');
const userService = require('../services/userService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

// Reuse file upload configuration
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (for videos, images will be validated separately)
  },
});

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NO_TOKEN_PROVIDED);
    }
    
    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
    
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED);
  }
};

// Helper to wrap async handlers (same as in routes/index.js)
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

class StatusController {
  // Upload status
  uploadStatus = [
    verifyToken,
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return sendError(res, HTTP_STATUS.BAD_REQUEST, err.message || 'File upload error');
        }
        next();
      });
    },
    asyncHandler(async (req, res) => {
      const { type } = req.body;
      
      if (!req.file) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
      }

      if (!type || !['image', 'video'].includes(type)) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid file type. Only image or video allowed');
      }

      // Validate file size based on type
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
      
      if (type === 'image' && req.file.size > MAX_IMAGE_SIZE) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Image size exceeds 2MB limit. Please choose a smaller image.');
      }
      
      if (type === 'video' && req.file.size > MAX_VIDEO_SIZE) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Video size exceeds 5MB limit. Please choose a smaller video.');
      }

      // Generate unique file ID
      const fileId = crypto.randomBytes(16).toString('hex');
      
      // Create file record
      const fileRecord = new File({
        fileId,
        fileName: req.file.originalname,
        fileType: type,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        uploadedBy: req.userEmail,
      });
      
      await fileRecord.save();

      // Create status
      const status = await statusService.createStatus(req.userEmail, fileId, type);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATUS_UPLOADED_SUCCESSFULLY, {
        status: {
          statusId: status._id.toString(),
          fileId: fileId,
          statusType: type,
          statusUrl: `/api/files/download/${fileId}`,
        },
      });
    }),
  ];

  // Get status feed (contacts' statuses)
  getStatusFeed = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Get contacts' statuses
    const statuses = await statusService.getStatusesForContacts(userEmail);
    
    // Get user's own status
    const myStatus = await statusService.getUserStatus(userEmail);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATUS_FEED_RETRIEVED_SUCCESSFULLY, {
      statuses,
      myStatus,
    });
  });

  // Mark status as viewed
  markAsViewed = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    
    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const viewerEmail = await userService.getUserByToken(token);
    if (!viewerEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }

    const { statusId } = req.body;
    if (!statusId) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.STATUS_ID_REQUIRED);
    }

    await statusService.markAsViewed(statusId, viewerEmail);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATUS_MARKED_AS_VIEWED);
  });

  // Get viewers list for a status
  getViewers = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }

    const { statusId } = req.params;
    if (!statusId) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.STATUS_ID_REQUIRED);
    }

    const viewers = await statusService.getViewers(statusId, userEmail);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.VIEWERS_RETRIEVED_SUCCESSFULLY, {
      viewers,
    });
  });
}

module.exports = new StatusController();

