const billSplitService = require('../services/billSplitService');
const userService = require('../services/userService');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES } = require('../constants');

class BillSplitController {
  /**
   * Create a bill split
   */
  async createBillSplit(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      const { contactEmail, groupId, billName, totalAmount, currency, splits } = req.body;
      
      if (!billName || !totalAmount) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Bill name and total amount are required');
      }
      
      if (!contactEmail && !groupId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Either contactEmail or groupId is required');
      }
      
      // If splits not provided, calculate equal splits
      let finalSplits = splits;
      if (!finalSplits || finalSplits.length === 0) {
        const userEmails = groupId 
          ? (await require('../models/Group').findById(groupId).select('members').lean())?.members || []
          : [userEmail, contactEmail];
        
        finalSplits = billSplitService.calculateEqualSplits(userEmails, totalAmount);
      }
      
      const result = await billSplitService.createBillSplit(
        userEmail,
        contactEmail,
        groupId,
        {
          billName,
          totalAmount,
          currency: currency || 'INR',
          splits: finalSplits,
        }
      );
      
      return sendSuccess(res, HTTP_STATUS.CREATED, 'Bill split created successfully', result);
    } catch (error) {
      console.error('Error in createBillSplit:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }
  
  /**
   * Get bill splits for a room/group
   */
  async getBillSplits(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      const { roomId, groupId } = req.query;
      
      if (!roomId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'roomId is required');
      }
      
      const billSplits = await billSplitService.getBillSplits(roomId, groupId);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Bill splits retrieved successfully', { billSplits });
    } catch (error) {
      console.error('Error in getBillSplits:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }
  
  /**
   * Mark split as paid
   */
  async markAsPaid(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      const { billSplitId } = req.body;
      
      if (!billSplitId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'billSplitId is required');
      }
      
      const result = await billSplitService.markSplitAsPaid(billSplitId, userEmail);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Split marked as paid', result);
    } catch (error) {
      console.error('Error in markAsPaid:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  /**
   * Send reminder for pending bills
   */
  async sendReminder(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      const { contactEmail, groupId, roomId } = req.body;
      
      if (!roomId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'roomId is required');
      }
      
      if (!contactEmail && !groupId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Either contactEmail or groupId is required');
      }
      
      const result = await billSplitService.sendReminder(userEmail, contactEmail, groupId, roomId);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Reminder sent successfully', result);
    } catch (error) {
      console.error('Error in sendReminder:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }
}

module.exports = new BillSplitController();

