import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING } from '../../constants';

const { width, height } = Dimensions.get('window');

const GLoader = ({ visible = false, message = 'Loading...' }) => {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  // useNativeDriver doesn't work on web, so disable it for web
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      // Stop any existing animations first
      if (animationRef.current) {
        animationRef.current.stop();
      }

      // Start animations
      const spinAnimation = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1500,
          useNativeDriver: useNativeDriver,
          })
      );

      const scaleAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.2,
              duration: 800,
            useNativeDriver: useNativeDriver,
            }),
            Animated.timing(scaleValue, {
              toValue: 0.8,
              duration: 800,
            useNativeDriver: useNativeDriver,
            }),
          ])
      );

      const fadeAnimation = Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
        useNativeDriver: useNativeDriver,
      });

      animationRef.current = Animated.parallel([
        spinAnimation,
        scaleAnimation,
        fadeAnimation,
      ]);

      animationRef.current.start();
    } else {
      // Stop animations when hidden
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      // Reset animation values
      spinValue.setValue(0);
      scaleValue.setValue(0.8);
      opacityValue.setValue(0);
    }

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              opacity: opacityValue,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spinnerContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={[styles.spinner, { borderColor: colors.primary }]}>
              <View style={[styles.spinnerInner, { borderColor: colors.primaryLight }]} />
            </View>
          </Animated.View>
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  spinnerInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  message: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
});

export default GLoader;

