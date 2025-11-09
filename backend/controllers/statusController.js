const statusService = require('../services/statusService');
const userService = require('../services/userService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');

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
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
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
          return res.status(400).json({ 
            success: false, 
            message: err.message || 'File upload error' 
          });
        }
        next();
      });
    },
    asyncHandler(async (req, res) => {
      const { type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      if (!type || !['image', 'video'].includes(type)) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only image or video allowed',
        });
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

      res.json({
        success: true,
        status: {
          statusId: status._id.toString(),
          fileId: fileId,
          statusType: type,
          statusUrl: `/api/files/download/${fileId}`,
        },
        message: 'Status uploaded successfully',
      });
    }),
  ];

  // Get status feed (contacts' statuses)
  getStatusFeed = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Get contacts' statuses
    const statuses = await statusService.getStatusesForContacts(userEmail);
    
    // Get user's own status
    const myStatus = await statusService.getUserStatus(userEmail);

    res.json({
      success: true,
      statuses,
      myStatus,
    });
  });

  // Mark status as viewed
  markAsViewed = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const viewerEmail = await userService.getUserByToken(token);
    if (!viewerEmail) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const { statusId } = req.body;
    if (!statusId) {
      return res.status(400).json({
        success: false,
        message: 'Status ID is required',
      });
    }

    await statusService.markAsViewed(statusId, viewerEmail);

    res.json({
      success: true,
      message: 'Status marked as viewed',
    });
  });

  // Get viewers list for a status
  getViewers = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const { statusId } = req.params;
    if (!statusId) {
      return res.status(400).json({
        success: false,
        message: 'Status ID is required',
      });
    }

    const viewers = await statusService.getViewers(statusId, userEmail);

    res.json({
      success: true,
      viewers,
    });
  });
}

module.exports = new StatusController();

