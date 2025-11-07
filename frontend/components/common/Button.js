import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'text'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    switch (variant) {
      case 'primary':
        baseStyle.push({ backgroundColor: colors.primary });
        break;
      case 'secondary':
        baseStyle.push({ backgroundColor: colors.divider });
        break;
      case 'outline':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        });
        break;
      case 'text':
        baseStyle.push({ backgroundColor: 'transparent' });
        break;
      default:
        baseStyle.push({ backgroundColor: colors.primary });
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push({ color: colors.white });
        break;
      case 'secondary':
        baseStyle.push({ color: colors.text });
        break;
      case 'outline':
        baseStyle.push({ color: colors.primary });
        break;
      case 'text':
        baseStyle.push({ color: colors.primary });
        break;
      default:
        baseStyle.push({ color: colors.white });
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.white : colors.primary} 
          size="small" 
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textMedium: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  textLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  icon: {
    marginRight: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});

export default Button;

