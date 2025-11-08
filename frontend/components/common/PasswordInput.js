import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const PasswordInput = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  onSubmitEditing,
  returnKeyType,
  ...props
}) => {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: '#1E3A5F',
            color: colors.inputText || colors.text,
            borderColor: '#FFFFFF',
            borderWidth: 1,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor || '#B0C4DE'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        {...props}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={togglePasswordVisibility}
        activeOpacity={0.7}
      >
        <Text style={[styles.eyeIconText, { color: colors.textSecondary || colors.text }]}>
          {showPassword ? '🙈' : '👁️'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingRight: 50, // Space for eye icon
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    zIndex: 1,
  },
  eyeIconText: {
    fontSize: 20,
  },
});

export default PasswordInput;

