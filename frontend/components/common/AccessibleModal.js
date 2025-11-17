import React, { useEffect } from 'react';
import { Modal, Platform } from 'react-native';

/**
 * AccessibleModal - A Modal wrapper that fixes aria-hidden accessibility issues on web
 * 
 * This component ensures that when a modal is open, focus is properly managed
 * and aria-hidden is not set on elements that contain focused descendants.
 * 
 * The issue occurs when React Native Web sets aria-hidden on the background
 * but a focused element exists inside the modal. This component monitors focus
 * and removes aria-hidden from ancestors of focused elements.
 */
const AccessibleModal = ({ 
  visible, 
  children, 
  onRequestClose,
  ...props 
}) => {
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      // Fix for aria-hidden warning: Monitor focus and remove aria-hidden
      // from ancestors of focused elements
      const fixAriaHidden = () => {
        const activeElement = document.activeElement;
        if (!activeElement || activeElement === document.body) {
          return;
        }

        // Walk up the DOM tree and remove aria-hidden from ancestors
        let current = activeElement.parentElement;
        while (current && current !== document.body) {
          if (current.hasAttribute('aria-hidden') && current.getAttribute('aria-hidden') === 'true') {
            // Only remove if this element actually contains the focused element
            if (current.contains(activeElement)) {
              current.removeAttribute('aria-hidden');
            }
          }
          current = current.parentElement;
        }
      };

      // Use MutationObserver to watch for aria-hidden changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            const activeElement = document.activeElement;
            if (activeElement && mutation.target.contains(activeElement)) {
              fixAriaHidden();
            }
          }
        });
      });

      // Observe the document body for aria-hidden attribute changes
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
        subtree: true,
      });

      // Also run on focus events
      const handleFocus = () => {
        requestAnimationFrame(fixAriaHidden);
      };
      
      document.addEventListener('focusin', handleFocus, true);
      
      // Initial fix
      requestAnimationFrame(fixAriaHidden);
      
      return () => {
        observer.disconnect();
        document.removeEventListener('focusin', handleFocus, true);
      };
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      accessibilityViewIsModal={true}
      {...props}
    >
      {children}
    </Modal>
  );
};

export default AccessibleModal;

