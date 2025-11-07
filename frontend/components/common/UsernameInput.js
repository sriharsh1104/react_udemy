import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const UsernameInput = ({ onJoin }) => {
  const [username, setUsername] = React.useState('');

  const handleJoin = () => {
    if (username.trim() && username.trim().length >= 2) {
      onJoin(username.trim());
    } else {
      Alert.alert('Invalid Username', 'Please enter a username (at least 2 characters)');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>💬</Text>
          </View>
        </View>
        
        <Text style={styles.title}>Welcome to Chat</Text>
        <Text style={styles.subtitle}>Enter your name to start chatting</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={COLORS.inputPlaceholder}
            value={username}
            onChangeText={setUsername}
            onSubmitEditing={handleJoin}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="go"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, !username.trim() && styles.buttonDisabled]} 
          onPress={handleJoin}
          disabled={!username.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});

export default UsernameInput;
