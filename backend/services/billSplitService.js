const BillSplit = require('../models/BillSplit');
const Message = require('../models/Message');
const chatService = require('./chatService');
const SocketService = require('./socketService');
const userService = require('./userService');

class BillSplitService {
  /**
   * Create a bill split
   */
  async createBillSplit(userEmail, contactEmail, groupId, billData) {
    try {
      const { billName, totalAmount, currency = 'INR', splits } = billData;
      
      // Validate total amount
      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0');
      }
      
      // Validate splits
      if (!splits || splits.length === 0) {
        throw new Error('At least one split is required');
      }
      
      // Calculate total of splits
      const splitTotal = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
      
      // Allow small rounding differences (0.01)
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        throw new Error(`Split amounts (${splitTotal}) must equal total amount (${totalAmount})`);
      }
      
      // Get room ID
      const roomId = groupId 
        ? `group_${groupId}` 
        : chatService.getRoomId(userEmail, contactEmail);
      
      // Create message for bill split FIRST (so we have messageId)
      const billMessage = `${billName} - ₹${totalAmount}`;
      const messageData = {
        senderEmail: userEmail,
        message: billMessage,
        timestamp: new Date(),
      };
      
      let savedMessage;
      if (groupId) {
        savedMessage = await chatService.addGroupMessage(groupId, messageData);
      } else {
        savedMessage = await chatService.addMessage(userEmail, contactEmail, messageData);
      }
      
      // Now create bill split with messageId
      // Mark the creator as paid (they already paid when creating the bill)
      const billSplit = new BillSplit({
        messageId: savedMessage._id,
        roomId,
        groupId: groupId || null,
        createdBy: userEmail,
        billName,
        totalAmount,
        currency,
        splits: splits.map(split => ({
          userEmail: split.userEmail,
          amount: split.amount,
          percentage: split.percentage || null,
          // Creator is automatically marked as paid
          paid: split.userEmail === userEmail,
          paidAt: split.userEmail === userEmail ? new Date() : null,
        })),
        // If creator is the only one, mark as fully paid, otherwise partially paid
        status: splits.length === 1 && splits[0].userEmail === userEmail ? 'fully_paid' : 'partially_paid',
      });
      
      await billSplit.save();
      
      // Link message to bill split
      await Message.findByIdAndUpdate(savedMessage._id, {
        isBillSplit: true,
        billSplitId: billSplit._id,
      });
      
      // Emit message via socket with bill split data
      const io = SocketService.getIO();
      if (io) {
        const billSplitObj = billSplit.toObject();
        
        if (groupId) {
          // Group message
          const messagePayload = {
            ...savedMessage,
            _id: savedMessage._id.toString(),
            messageId: savedMessage._id.toString(),
            roomId,
            groupId,
            isBillSplit: true,
            billSplitData: billSplitObj,
          };
          io.to(roomId).emit('groupMessage', messagePayload);
        } else {
          // Private message
          const messagePayload = {
            ...savedMessage,
            _id: savedMessage._id.toString(),
            messageId: savedMessage._id.toString(),
            roomId,
            contactEmail: contactEmail,
            isBillSplit: true,
            billSplitData: billSplitObj,
          };
          
          // Emit to receiver
          const receiverSocketId = await userService.getSocketByEmail(contactEmail);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('privateMessage', messagePayload);
          }
          
          // Emit to sender
          const senderSocketId = await userService.getSocketByEmail(userEmail);
          if (senderSocketId) {
            io.to(senderSocketId).emit('privateMessage', messagePayload);
          }
        }
      }
      
      return {
        success: true,
        billSplit: billSplit.toObject(),
        message: savedMessage,
      };
    } catch (error) {
      console.error('Error creating bill split:', error);
      throw error;
    }
  }
  
  /**
   * Get bill splits for a room/group
   */
  async getBillSplits(roomId, groupId = null) {
    try {
      const query = { roomId };
      if (groupId) {
        query.groupId = groupId;
      }
      
      const billSplits = await BillSplit.find(query)
        .sort({ createdAt: -1 })
        .lean();
      
      return billSplits;
    } catch (error) {
      console.error('Error getting bill splits:', error);
      return [];
    }
  }
  
  /**
   * Get bill split by ID
   */
  async getBillSplitById(billSplitId) {
    try {
      const billSplit = await BillSplit.findById(billSplitId).lean();
      return billSplit;
    } catch (error) {
      console.error('Error getting bill split:', error);
      return null;
    }
  }
  
  /**
   * Mark split as paid
   */
  async markSplitAsPaid(billSplitId, userEmail) {
    try {
      const billSplit = await BillSplit.findById(billSplitId);
      if (!billSplit) {
        throw new Error('Bill split not found');
      }
      
      // Find user's split
      const userSplit = billSplit.splits.find(s => s.userEmail === userEmail);
      if (!userSplit) {
        throw new Error('User not found in bill split');
      }
      
      if (userSplit.paid) {
        return { success: true, message: 'Already marked as paid', billSplit: billSplit.toObject() };
      }
      
      // Mark as paid
      userSplit.paid = true;
      userSplit.paidAt = new Date();
      
      // Update status
      const allPaid = billSplit.splits.every(s => s.paid);
      const somePaid = billSplit.splits.some(s => s.paid);
      
      if (allPaid) {
        billSplit.status = 'fully_paid';
      } else if (somePaid) {
        billSplit.status = 'partially_paid';
      }
      
      billSplit.updatedAt = new Date();
      await billSplit.save();
      
      return {
        success: true,
        billSplit: billSplit.toObject(),
      };
    } catch (error) {
      console.error('Error marking split as paid:', error);
      throw error;
    }
  }
  
  /**
   * Send reminder for pending bills
   */
  async sendReminder(userEmail, contactEmail, groupId, roomId) {
    try {
      // Get all pending bills
      const bills = await this.getBillSplits(roomId, groupId);
      const pendingBills = bills.filter(bill => 
        bill.status === 'pending' || bill.status === 'partially_paid'
      );

      if (pendingBills.length === 0) {
        throw new Error('No pending bills to remind');
      }

      // Calculate total pending and who owes what
      let totalPending = 0;
      const peopleWhoOwe = [];

      pendingBills.forEach((bill) => {
        const billCreator = bill.createdBy;
        bill.splits?.forEach((split) => {
          // Skip creator - they already paid
          if (split.userEmail === billCreator) {
            return;
          }

          if (!split.paid) {
            totalPending += split.amount;
            
            // Track who owes
            const existing = peopleWhoOwe.find(p => p.userEmail === split.userEmail);
            if (existing) {
              existing.amount += split.amount;
              existing.bills.push({
                billName: bill.billName,
                amount: split.amount,
              });
            } else {
              peopleWhoOwe.push({
                userEmail: split.userEmail,
                amount: split.amount,
                bills: [{
                  billName: bill.billName,
                  amount: split.amount,
                }],
              });
            }
          }
        });
      });

      if (peopleWhoOwe.length === 0) {
        throw new Error('No pending payments to remind');
      }

      // Create detailed reminder message
      const chatService = require('./chatService');
      
      // Build detailed message with bill breakdown
      let reminderMessage = `🔔 Reminder: Total pending amount is ₹${totalPending.toFixed(2)}\n\n`;
      
      // Add breakdown by person
      peopleWhoOwe.forEach((person, index) => {
        reminderMessage += `${index + 1}. ${person.userEmail.split('@')[0]}: ₹${person.amount.toFixed(2)}\n`;
      });
      
      reminderMessage += `\nPlease settle your pending bills.`;
      
      const messageData = {
        senderEmail: userEmail,
        message: reminderMessage,
        timestamp: new Date(),
        isReminder: true, // Mark as reminder message
      };

      let savedMessage;
      if (groupId) {
        savedMessage = await chatService.addGroupMessage(groupId, messageData);
      } else {
        savedMessage = await chatService.addMessage(userEmail, contactEmail, messageData);
      }
      
      // isReminder is already set in messageData, so it should be saved automatically
      // But ensure it's set in case addMessage doesn't pass it through
      if (!savedMessage.isReminder) {
        const Message = require('../models/Message');
        await Message.findByIdAndUpdate(savedMessage._id, { isReminder: true });
      }

      // Emit reminder message via socket ONLY to people who owe (not to sender)
      const io = SocketService.getIO();
      if (io) {
        // Create proper message payload structure (same as regular messages)
        const messagePayload = {
          senderEmail: savedMessage.senderEmail,
          message: savedMessage.message, // Ensure this is a string, not an object
          timestamp: savedMessage.timestamp,
          _id: savedMessage._id.toString(),
          messageId: savedMessage._id.toString(),
          roomId,
          status: savedMessage.status || 'sent',
          readBy: savedMessage.readBy || [],
          isDeleted: savedMessage.isDeleted || false,
          editedAt: savedMessage.editedAt || null,
          replyTo: savedMessage.replyTo || null,
          replyToMessage: savedMessage.replyToMessage || null,
          replyToSender: savedMessage.replyToSender || null,
          isCallMessage: savedMessage.isCallMessage || false,
          callRecord: savedMessage.callRecord || null,
          isBillSplit: savedMessage.isBillSplit || false,
          billSplitData: savedMessage.billSplitData || null,
          ...(groupId ? { groupId } : { contactEmail }),
        };

        if (groupId) {
          // Group message - emit to room (all members will see it)
          io.to(roomId).emit('groupMessage', messagePayload);
        } else {
          // Private message - emit ONLY to people who owe (not to sender)
          for (const person of peopleWhoOwe) {
            // Skip if this person is the sender (shouldn't happen, but safety check)
            if (person.userEmail === userEmail) {
              continue;
            }
            
            const socketId = await userService.getSocketByEmail(person.userEmail);
            if (socketId) {
              io.to(socketId).emit('privateMessage', messagePayload);
            }
          }
          
          // DO NOT emit to sender - they already know they sent the reminder
        }
      }

      return {
        success: true,
        message: 'Reminder sent successfully', // Return string message, not the entire message object
        totalPending,
        peopleWhoOwe,
        messageId: savedMessage._id?.toString() || null, // Include messageId if needed
      };
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  /**
   * Calculate default splits (equal split)
   */
  calculateEqualSplits(userEmails, totalAmount) {
    const count = userEmails.length;
    const perPerson = totalAmount / count;
    const splits = userEmails.map(email => ({
      userEmail: email,
      amount: Math.round(perPerson * 100) / 100, // Round to 2 decimal places
    }));
    
    // Adjust last split to account for rounding
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(total - totalAmount) > 0.01) {
      splits[splits.length - 1].amount += (totalAmount - total);
      splits[splits.length - 1].amount = Math.round(splits[splits.length - 1].amount * 100) / 100;
    }
    
    return splits;
  }
}

module.exports = new BillSplitService();

