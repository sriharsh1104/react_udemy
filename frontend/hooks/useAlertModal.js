import { useState, useCallback } from 'react';

/**
 * Custom hook to manage Alert Modal state
 * Replaces Alert.alert with a better UI modal experience
 * 
 * @returns {Object} { showAlert, showConfirm, alertState, confirmState, hideAlert, hideConfirm }
 */
const useAlertModal = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: 'Alert',
    message: '',
    buttonText: 'OK',
    type: 'default', // 'default' | 'success' | 'error' | 'warning' | 'info'
    onClose: null,
  });

  const [confirmState, setConfirmState] = useState({
    visible: false,
    title: 'Confirm',
    message: '',
    confirmText: 'Yes',
    cancelText: 'No',
    confirmButtonStyle: 'default', // 'default' | 'destructive'
    onConfirm: null,
    onCancel: null,
  });

  const [actionState, setActionState] = useState({
    visible: false,
    title: '',
    message: '',
    options: [],
    onClose: null,
  });

  const showAlert = useCallback((title, message, options = {}) => {
    const {
      buttonText = 'OK',
      type = 'default',
      onClose = null,
    } = options;

    setAlertState({
      visible: true,
      title,
      message,
      buttonText,
      type,
      onClose,
    });
  }, []);

  const showConfirm = useCallback((title, message, options = {}) => {
    const {
      confirmText = 'Yes',
      cancelText = 'No',
      confirmButtonStyle = 'default',
      onConfirm = null,
      onCancel = null,
    } = options;

    setConfirmState({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      confirmButtonStyle,
      onConfirm,
      onCancel,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => {
      if (prev.onClose) {
        prev.onClose();
      }
      return { ...prev, visible: false };
    });
  }, []);

  const hideConfirm = useCallback((confirmed = false) => {
    setConfirmState((prev) => {
      if (confirmed && prev.onConfirm) {
        prev.onConfirm();
      } else if (!confirmed && prev.onCancel) {
        prev.onCancel();
      }
      return { ...prev, visible: false };
    });
  }, []);

  const showAction = useCallback((title, message, options = [], onClose = null) => {
    setActionState({
      visible: true,
      title,
      message,
      options,
      onClose,
    });
  }, []);

  const hideAction = useCallback(() => {
    setActionState((prev) => {
      if (prev.onClose) {
        prev.onClose();
      }
      return { ...prev, visible: false };
    });
  }, []);

  return {
    showAlert,
    showConfirm,
    showAction,
    alertState,
    confirmState,
    actionState,
    hideAlert,
    hideConfirm,
    hideAction,
  };
};

export default useAlertModal;

