import React, { useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
  Text,
} from 'react-native';
import { COLORS } from '../../constants';

const FullScreenImageViewer = ({ visible, imageUri, onClose }) => {
  useEffect(() => {
    if (!visible) return;

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    // Handle ESC key on web
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      backHandler.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [visible, onClose]);

  if (!visible || !imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.closeIconContainer}>
            <Text style={styles.closeIcon}>✕</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={1}
          onPress={onClose}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default FullScreenImageViewer;

