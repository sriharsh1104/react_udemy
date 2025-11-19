import { Platform } from 'react-native';

const APP_TITLE = 'onlygossips247';

/**
 * Set browser title to always show "onlygossips247" on web
 */
export const setupBrowserTitle = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // Set initial title
    document.title = APP_TITLE;
    
    // Watch for title changes and reset it back
    const titleObserver = new MutationObserver(() => {
      if (document.title !== APP_TITLE) {
        document.title = APP_TITLE;
      }
    });
    
    // Observe title element changes
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // Also periodically check and reset (fallback)
    const titleCheckInterval = setInterval(() => {
      if (document.title !== APP_TITLE) {
        document.title = APP_TITLE;
      }
    }, 100);
    
    return () => {
      titleObserver.disconnect();
      clearInterval(titleCheckInterval);
    };
  }
  return () => {}; // No-op cleanup for non-web platforms
};

