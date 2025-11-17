import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './PasswordInput.styles';

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

export default PasswordInput;

