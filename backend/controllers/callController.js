const Call = require('../models/Call');
const userService = require('../services/userService');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');
const { sendSuccess, sendError } = require('../utils/responseHelper');

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

class CallController {
  // Get call history
  async getCallHistory(req, res) {
    try {
      const email = req.userEmail; // From auth middleware
      const { contactEmail, groupId } = req.query;

      let query = {
        $or: [
          { callerEmail: email },
          { receiverEmail: email },
        ],
      };

      if (contactEmail) {
        query = {
          $or: [
            { callerEmail: email, receiverEmail: contactEmail },
            { callerEmail: contactEmail, receiverEmail: email },
          ],
        };
      }

      if (groupId) {
        query = {
          groupId: groupId,
          $or: [
            { callerEmail: email },
            { receiverEmail: email },
          ],
        };
      }

      const calls = await Call.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return sendSuccess(res, HTTP_STATUS.OK, 'Call history retrieved successfully', {
        calls,
        count: calls.length,
      });
    } catch (error) {
      console.error('Error fetching call history:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Create a new call record
  async createCall(req, res) {
    try {
      const email = req.userEmail;
      const { receiverEmail, groupId, type, direction } = req.body;

      if (!type || !direction) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Call type and direction are required');
      }

      if (!receiverEmail && !groupId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Either receiverEmail or groupId is required');
      }

      const callData = {
        callerEmail: email,
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type,
        direction,
        status: 'ringing',
      };

      const call = new Call(callData);
      await call.save();

      return sendSuccess(res, HTTP_STATUS.CREATED, 'Call initiated', {
        call,
      });
    } catch (error) {
      console.error('Error creating call:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Update call status
  async updateCallStatus(req, res) {
    try {
      const { callId } = req.params;
      const { status, duration, startedAt, endedAt } = req.body;

      const call = await Call.findById(callId);
      if (!call) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Call not found');
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (duration !== undefined) updateData.duration = duration;
      if (startedAt) updateData.startedAt = new Date(startedAt);
      if (endedAt) updateData.endedAt = new Date(endedAt);
      updateData.updatedAt = new Date();

      Object.assign(call, updateData);
      await call.save();

      return sendSuccess(res, HTTP_STATUS.OK, 'Call status updated', {
        call,
      });
    } catch (error) {
      console.error('Error updating call status:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Get call statistics
  async getCallStats(req, res) {
    try {
      const email = req.userEmail;
      const { startDate, endDate } = req.query;

      let dateQuery = {};
      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      const query = {
        $or: [
          { callerEmail: email },
          { receiverEmail: email },
        ],
        ...dateQuery,
      };

      const [totalCalls, completedCalls, missedCalls, totalDuration] = await Promise.all([
        Call.countDocuments(query),
        Call.countDocuments({ ...query, status: 'completed' }),
        Call.countDocuments({ ...query, status: 'missed' }),
        Call.aggregate([
          { $match: { ...query, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$duration' } } },
        ]),
      ]);

      const stats = {
        totalCalls,
        completedCalls,
        missedCalls,
        declinedCalls: await Call.countDocuments({ ...query, status: 'declined' }),
        totalDuration: totalDuration[0]?.total || 0,
      };

      return sendSuccess(res, HTTP_STATUS.OK, 'Call statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Error fetching call stats:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = {
  controller: new CallController(),
  verifyToken,
};

