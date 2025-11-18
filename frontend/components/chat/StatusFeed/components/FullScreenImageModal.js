import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity } from 'react-native';
import styles from '../StatusFeed.styles';

const FullScreenImageModal = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenImageContainer}>
        <TouchableOpacity
          style={styles.fullScreenCloseButton}
          onPress={onClose}
        >
          <Text style={styles.fullScreenCloseButtonText}>✕</Text>
        </TouchableOpacity>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
};

export default FullScreenImageModal;

