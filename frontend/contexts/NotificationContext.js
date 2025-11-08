import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotification: () => {},
  markAsRead: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now().toString();
    const newNotification = {
      id,
      senderEmail: notification.senderEmail,
      senderName: notification.senderName,
      message: notification.message,
      timestamp: notification.timestamp || new Date(),
      type: notification.type || 'private', // 'private' or 'group'
      groupId: notification.groupId,
      groupName: notification.groupName,
      onPress: notification.onPress,
      onMarkAsRead: notification.onMarkAsRead,
    };

    setNotifications((prev) => {
      // Remove any existing notification from the same sender
      const filtered = prev.filter(n => n.senderEmail !== notification.senderEmail);
      return [...filtered, newNotification];
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  const clearNotification = useCallback((senderEmail) => {
    setNotifications((prev) => prev.filter(n => n.senderEmail !== senderEmail));
  }, []);

  const markAsRead = useCallback((senderEmail, onMarkAsRead) => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    clearNotification(senderEmail);
  }, [clearNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotification,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

