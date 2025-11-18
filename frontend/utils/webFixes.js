import { Platform } from 'react-native';

/**
 * Web-specific fixes for React Native Web
 * Fixes non-passive wheel event listener warning and aria-hidden accessibility issues
 */
export const setupWebFixes = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  // Fix for non-passive wheel event listener warning
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'wheel') {
      if (typeof options !== 'object' || options === null) {
        options = { passive: true };
      } else if (options.passive === undefined) {
        options = { ...options, passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Global fix for aria-hidden accessibility warning
  const fixAriaHiddenForFocusedElements = () => {
    const activeElement = document.activeElement;
    if (!activeElement || activeElement === document.body || activeElement === document.documentElement) {
      return;
    }

    let current = activeElement.parentElement;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.hasAttribute('aria-hidden') && current.getAttribute('aria-hidden') === 'true') {
        if (current.contains(activeElement)) {
          current.removeAttribute('aria-hidden');
        }
      }
      current = current.parentElement;
    }
  };

  const observer = new MutationObserver(() => {
    requestAnimationFrame(fixAriaHiddenForFocusedElements);
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
    subtree: true,
  });

  const handleFocus = () => {
    requestAnimationFrame(fixAriaHiddenForFocusedElements);
  };
  
  document.addEventListener('focusin', handleFocus, true);
  requestAnimationFrame(fixAriaHiddenForFocusedElements);
};

/**
 * Set browser title to always show "onlygossips247" on web
 */
export const setupWebTitle = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return () => {};
  }

  document.title = 'onlygossips247';
  
  const titleObserver = new MutationObserver(() => {
    if (document.title !== 'onlygossips247') {
      document.title = 'onlygossips247';
    }
  });
  
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleObserver.observe(titleElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  const titleCheckInterval = setInterval(() => {
    if (document.title !== 'onlygossips247') {
      document.title = 'onlygossips247';
    }
  }, 100);
  
  return () => {
    titleObserver.disconnect();
    clearInterval(titleCheckInterval);
  };
};

