const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');
const userService = require('../services/userService');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
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

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/mp3', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
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

class FileController {
  // Upload file
  uploadFile = [
    verifyToken,
    (req, res, next) => {
      // Multer error handler
      upload.single('file')(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return sendError(res, HTTP_STATUS.BAD_REQUEST, err.message || 'File upload error');
        }
        next();
      });
    },
    async (req, res) => {
      try {
        console.log('File upload request received:', {
          hasFile: !!req.file,
          body: req.body,
          headers: req.headers['content-type'],
        });
        
        if (!req.file) {
          console.error('No file in request:', {
            files: req.files,
            body: req.body,
            headers: req.headers,
          });
          return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
        }
        
        const { type } = req.body;
        if (!type || !['image', 'video', 'audio', 'pdf'].includes(type)) {
          // Delete uploaded file
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
          return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid file type');
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
        
        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.FILE_UPLOADED_SUCCESSFULLY, {
          fileId,
          fileName: req.file.originalname,
          fileType: type,
          fileSize: req.file.size,
        });
      } catch (error) {
        console.error('File upload error:', error);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'File upload failed');
      }
    },
  ];
  
  // Download file
  downloadFile = [
    verifyToken,
    async (req, res) => {
      try {
        const { fileId } = req.params;
        
        const fileRecord = await File.findOne({ fileId });
        if (!fileRecord) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'File not found');
        }
        
        if (!fs.existsSync(fileRecord.filePath)) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'File not found on server');
        }
        
        // Mark as downloaded
        fileRecord.downloaded = true;
        fileRecord.downloadedAt = new Date();
        fileRecord.downloadedBy = req.userEmail;
        await fileRecord.save();
        
        // Send file
        res.download(fileRecord.filePath, fileRecord.fileName, (err) => {
          if (err) {
            console.error('File download error:', err);
            return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'File download failed');
          } else {
            // Delete file from server after successful download
            setTimeout(() => {
              if (fs.existsSync(fileRecord.filePath)) {
                fs.unlinkSync(fileRecord.filePath);
                fileRecord.deleteOne().catch(console.error);
              }
            }, 1000); // Wait 1 second before deletion
          }
        });
      } catch (error) {
        console.error('File download error:', error);
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'File download failed');
      }
    },
  ];
  
  // Delete file
  deleteFile = [
    verifyToken,
    async (req, res) => {
      try {
        const { fileId } = req.params;
        
        const fileRecord = await File.findOne({ fileId });
        if (!fileRecord) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'File not found');
        }
        
        // Check if user has permission (uploaded by them)
        if (fileRecord.uploadedBy !== req.userEmail) {
          return sendError(res, HTTP_STATUS.FORBIDDEN, 'Permission denied');
        }
        
        // Delete file from filesystem
        if (fs.existsSync(fileRecord.filePath)) {
          fs.unlinkSync(fileRecord.filePath);
        }
        
        // Delete from database
        await fileRecord.deleteOne();
        
        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.FILE_DELETED_SUCCESSFULLY);
      } catch (error) {
        console.error('File deletion error:', error);
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'File deletion failed');
      }
    },
  ];
}

module.exports = new FileController();

