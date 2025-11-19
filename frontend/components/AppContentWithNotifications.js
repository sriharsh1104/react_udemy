import React, { Suspense } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationContainer } from '../config/lazyScreens';
import logger from '../utils/logger';
import AppContent from './AppContent';

/**
 * Wrapper component that handles notifications and renders AppContent
 */
const AppContentWithNotifications = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();
  const navigationRef = React.useRef(null);
  
  const handleNotificationPress = (notification) => {
    // Call the notification's onPress handler if it exists
    if (notification.onPress) {
      notification.onPress();
    }
    removeNotification(notification.id);
  };

  const handleNotificationMarkAsRead = (notification) => {
    if (notification.onMarkAsRead) {
      notification.onMarkAsRead();
    }
    markAsRead(notification.senderEmail, notification.onMarkAsRead);
  };

  const handleNotificationReply = (notification) => {
    // Reply input will be shown inline in notification
  };

  const handleSendReply = (notification, message) => {
    logger.log('📨 App: handleSendReply called', {
      hasNotification: !!notification,
      hasOnReply: !!(notification && notification.onReply),
      senderEmail: notification?.senderEmail,
      message: message
    });
    
    if (notification && notification.onReply) {
      try {
        logger.log('✅ App: Calling notification.onReply...');
        notification.onReply(message);
        logger.log('✅ App: notification.onReply called successfully');
      } catch (error) {
        logger.error('❌ App: Error calling notification.onReply:', error);
      }
    } else {
      logger.error('❌ App: Missing notification or onReply callback', {
        hasNotification: !!notification,
        hasOnReply: !!(notification && notification.onReply)
      });
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <NotificationContainer
          notifications={notifications}
          onDismiss={removeNotification}
          onPress={handleNotificationPress}
          onMarkAsRead={handleNotificationMarkAsRead}
          onReply={handleNotificationReply}
          onSendReply={handleSendReply}
        />
      </Suspense>
      <AppContent navigationRef={navigationRef} />
    </>
  );
};

export default AppContentWithNotifications;

