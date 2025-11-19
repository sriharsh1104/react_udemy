import { Platform } from 'react-native';

/**
 * Apply web-specific patches for React Native Web compatibility
 * - Fixes non-passive wheel event listener warnings
 * - Fixes aria-hidden accessibility warnings
 */
export const applyWebPatches = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Patch addEventListener to make wheel events passive by default
    // This fixes the violation warning from React Native Web's ScrollView
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // If it's a wheel event and options is not explicitly an object with passive: false,
      // make it passive to improve scroll performance
      if (type === 'wheel') {
        if (typeof options !== 'object' || options === null) {
          options = { passive: true };
        } else if (options.passive === undefined) {
          // Only set passive if not explicitly set to false
          options = { ...options, passive: true };
        }
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Global fix for aria-hidden accessibility warning
    // Monitor for focused elements inside aria-hidden containers
    const fixAriaHiddenForFocusedElements = () => {
      const activeElement = document.activeElement;
      if (!activeElement || activeElement === document.body || activeElement === document.documentElement) {
        return;
      }

      // Walk up the DOM tree and remove aria-hidden from ancestors of focused elements
      let current = activeElement.parentElement;
      while (current && current !== document.body && current !== document.documentElement) {
        if (current.hasAttribute('aria-hidden') && current.getAttribute('aria-hidden') === 'true') {
          // Only remove if this element actually contains the focused element
          if (current.contains(activeElement)) {
            current.removeAttribute('aria-hidden');
          }
        }
        current = current.parentElement;
      }
    };

    // Use MutationObserver to watch for aria-hidden changes and focused elements
    const observer = new MutationObserver(() => {
      requestAnimationFrame(fixAriaHiddenForFocusedElements);
    });

    // Observe the document body for aria-hidden attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true,
    });

    // Also run on focus events
    const handleFocus = () => {
      requestAnimationFrame(fixAriaHiddenForFocusedElements);
    };
    
    document.addEventListener('focusin', handleFocus, true);
    
    // Initial check
    requestAnimationFrame(fixAriaHiddenForFocusedElements);
  }
};

