import React from 'react';
import { View, Text } from 'react-native';
import styles from './TypingIndicator.styles';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  // Extract name from email if needed
  const getDisplayName = (email) => {
    if (!email) return 'Someone';
    return email.split('@')[0];
  };

  const displayName = typingUsers.length === 1 
    ? getDisplayName(typingUsers[0])
    : typingUsers.map(getDisplayName).join(', ');

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
      <Text style={styles.text}>
        {displayName} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </Text>
    </View>
  );
};

export default TypingIndicator;

