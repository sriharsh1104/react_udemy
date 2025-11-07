import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const MessageInput = ({ value, onChangeText, onSend }) => {
  const handleSend = () => {
    if (value.trim()) {
      onSend();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={COLORS.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
          textAlignVertical="center"
        />
        <TouchableOpacity 
          style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!value.trim()}
          activeOpacity={0.7}
        >
          <View style={styles.sendIcon}>
            <Text style={styles.sendIconText}>➤</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.inputBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    minHeight: 44,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : SPACING.xs / 2,
    maxHeight: 80,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  sendIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MessageInput;
