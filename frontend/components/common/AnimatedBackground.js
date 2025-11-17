import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedBackground = () => {
  const { colors } = useTheme();
  
  // Animation values for floating elements
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const floatingAnim4 = useRef(new Animated.Value(0)).current;
  const floatingAnim5 = useRef(new Animated.Value(0)).current;
  
  // Animation values for connecting lines
  const lineAnim1 = useRef(new Animated.Value(0)).current;
  const lineAnim2 = useRef(new Animated.Value(0)).current;
  const lineAnim3 = useRef(new Animated.Value(0)).current;
  
  // Animation values for privacy icons (locks/shields)
  const lockAnim1 = useRef(new Animated.Value(0)).current;
  const lockAnim2 = useRef(new Animated.Value(0)).current;
  const lockAnim3 = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for human avatars
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Rotation animations for avatars
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim3 = useRef(new Animated.Value(0)).current;
  
  // Glow animation for connecting lines
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // AI-generated style blob animations
  const blobAnim1 = useRef(new Animated.Value(0)).current;
  const blobAnim2 = useRef(new Animated.Value(0)).current;
  const blobAnim3 = useRef(new Animated.Value(0)).current;
  const blobAnim4 = useRef(new Animated.Value(0)).current;
  
  // Abstract shape animations
  const shapeAnim1 = useRef(new Animated.Value(0)).current;
  const shapeAnim2 = useRef(new Animated.Value(0)).current;
  const shapeAnim3 = useRef(new Animated.Value(0)).current;
  
  // Particle animations - create refs for particles
  const particleAnims = useRef(
    Array.from({ length: 25 }, () => ({
      anim: new Animated.Value(0),
      x: Math.random() * SCREEN_WIDTH,
      y: SCREEN_HEIGHT + Math.random() * 200,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    // Floating animations for human avatars
    const createFloatingAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Connecting line animations
    const createLineAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Lock/Shield pulse animation
    const createLockAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Pulse animation for avatars
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Rotation animations
    const createRotationAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    // Glow animation for lines
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    
    // AI-generated blob animations (morphing shapes)
    const createBlobAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    // Abstract shape floating animation
    const createShapeAnimation = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 5000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start all animations
    createFloatingAnimation(floatingAnim1, 0).start();
    createFloatingAnimation(floatingAnim2, 500).start();
    createFloatingAnimation(floatingAnim3, 1000).start();
    createFloatingAnimation(floatingAnim4, 1500).start();
    createFloatingAnimation(floatingAnim5, 2000).start();
    
    createLineAnimation(lineAnim1, 0).start();
    createLineAnimation(lineAnim2, 700).start();
    createLineAnimation(lineAnim3, 1400).start();
    
    createLockAnimation(lockAnim1, 0).start();
    createLockAnimation(lockAnim2, 500).start();
    createLockAnimation(lockAnim3, 1000).start();
    
    pulseAnimation.start();
    glowAnimation.start();
    shimmerAnimation.start();
    
    createRotationAnimation(rotateAnim1, 0).start();
    createRotationAnimation(rotateAnim2, 1000).start();
    createRotationAnimation(rotateAnim3, 2000).start();
    
    // Start AI-generated blob animations
    createBlobAnimation(blobAnim1, 0).start();
    createBlobAnimation(blobAnim2, 1000).start();
    createBlobAnimation(blobAnim3, 2000).start();
    createBlobAnimation(blobAnim4, 3000).start();
    
    // Start abstract shape animations
    createShapeAnimation(shapeAnim1, 0).start();
    createShapeAnimation(shapeAnim2, 1500).start();
    createShapeAnimation(shapeAnim3, 3000).start();
    
    // Start particle animations
    particleAnims.forEach((particle, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(particle.anim, {
            toValue: 1,
            duration: 5000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.anim, {
            toValue: 0,
            duration: 5000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Interpolate floating positions
  const translateY1 = floatingAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  
  const translateY2 = floatingAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });
  
  const translateY3 = floatingAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });
  
  const translateY4 = floatingAnim4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  
  const translateY5 = floatingAnim5.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  // Interpolate line opacity
  const lineOpacity1 = lineAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });
  
  const lineOpacity2 = lineAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.7, 0.2],
  });
  
  const lineOpacity3 = lineAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.75, 0.25],
  });

  // Interpolate lock scale
  const lockScale1 = lockAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  
  const lockScale2 = lockAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  
  const lockScale3 = lockAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });
  
  // Interpolate rotation
  const rotate1 = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const rotate2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  
  const rotate3 = rotateAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Glow opacity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });
  
  // Shimmer position
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });
  
  // Blob morphing animations
  const blobScale1 = blobAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1],
  });
  
  const blobOpacity1 = blobAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });
  
  const blobScale2 = blobAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.4, 1],
  });
  
  const blobOpacity2 = blobAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.6, 0.2],
  });
  
  const blobScale3 = blobAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.35, 1],
  });
  
  const blobOpacity3 = blobAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.65, 0.25],
  });
  
  const blobScale4 = blobAnim4.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.25, 1],
  });
  
  const blobOpacity4 = blobAnim4.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });
  
  // Abstract shape animations
  const shapeTranslateY1 = shapeAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });
  
  const shapeRotate1 = shapeAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const shapeTranslateY2 = shapeAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });
  
  const shapeRotate2 = shapeAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });
  
  const shapeTranslateY3 = shapeAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  
  const shapeRotate3 = shapeAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Human avatar component with glow
  const HumanAvatar = ({ emoji, x, y, translateY, scale, rotate, index }) => {
    const glowScale = scale.interpolate({
      inputRange: [1, 1.15],
      outputRange: [1.3, 1.5],
    });
    
    return (
      <Animated.View
        style={[
          styles.avatar,
          {
            left: x,
            top: y,
            transform: [{ translateY }, { scale }, { rotate }],
          },
        ]}
      >
        {/* Glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              backgroundColor: colors.primary + '20',
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <View style={[styles.avatarCircle, { 
          backgroundColor: colors.primary + '60',
          borderColor: colors.primary + '80',
          shadowColor: colors.primary,
        }]}>
          <Animated.Text style={[styles.avatarEmoji, { transform: [{ scale: pulseAnim }] }]}>
            {emoji}
          </Animated.Text>
        </View>
      </Animated.View>
    );
  };

  // Connecting line component with glow
  const ConnectingLine = ({ startX, startY, endX, endY, opacity, glowOpacity }) => {
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    
    return (
      <Animated.View
        style={[
          styles.connectingLine,
          {
            left: startX,
            top: startY,
            width: length,
            opacity,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.lineGlow,
            {
              backgroundColor: colors.primary + '50',
              opacity: glowOpacity,
            },
          ]}
        />
        <Animated.View style={[styles.lineDot, { 
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          opacity: glowOpacity,
        }]} />
        {/* Animated dot moving along line */}
        <Animated.View
          style={[
            styles.lineMovingDot,
            {
              backgroundColor: colors.primaryLight || colors.primary,
              opacity: glowOpacity,
            },
          ]}
        />
      </Animated.View>
    );
  };

  // Privacy lock/shield component with glow
  const PrivacyIcon = ({ icon, x, y, scale }) => {
    const glowScale = scale.interpolate({
      inputRange: [1, 1.22],
      outputRange: [1.4, 1.6],
    });
    
    return (
      <Animated.View
        style={[
          styles.privacyIcon,
          {
            left: x,
            top: y,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Glow behind icon */}
        <Animated.View
          style={[
            styles.iconGlow,
            {
              backgroundColor: colors.primary + '30',
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <Text style={[styles.privacyIconText, 
          Platform.OS === 'web' ? {
            textShadow: `0px 0px 10px ${colors.primary}80`,
          } : {
          textShadowColor: colors.primary + '80',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
          }
        ]}>{icon}</Text>
      </Animated.View>
    );
  };

  // AI-generated style blob component
  const AIGeneratedBlob = ({ x, y, size, scale, opacity, color1, color2 }) => (
    <Animated.View
      style={[
        styles.aiBlob,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      {/* Gradient effect using multiple layers */}
      <View style={[styles.blobInner, { backgroundColor: color1 }]} />
      <View style={[styles.blobOuter, { backgroundColor: color2 }]} />
    </Animated.View>
  );
  
  // Abstract geometric shape component
  const AbstractShape = ({ x, y, size, translateY, rotate, shape }) => {
    const shapeStyle = shape === 'circle' 
      ? { borderRadius: size / 2 }
      : shape === 'triangle'
      ? styles.triangle
      : {};
    
    return (
      <Animated.View
        style={[
          styles.abstractShape,
          {
            left: x,
            top: y,
            width: size,
            height: size,
            transform: [{ translateY }, { rotate }],
          },
          shapeStyle,
        ]}
      >
        <View style={[styles.shapeInner, { backgroundColor: colors.primary + '40' }]} />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, pointerEvents: 'none' }]}>
      {/* Premium gradient overlay for depth */}
      <View style={[styles.gradientOverlay, { backgroundColor: colors.primary + '08' }]} />
      <View style={[styles.gradientOverlay2, { backgroundColor: colors.primary + '05' }]} />
      
      {/* AI-Generated Style Blobs - Large gradient orbs */}
      <AIGeneratedBlob
        x={SCREEN_WIDTH * 0.1}
        y={SCREEN_HEIGHT * 0.1}
        size={200}
        scale={blobScale1}
        opacity={blobOpacity1}
        color1={colors.primary + '30'}
        color2={colors.primary + '15'}
      />
      <AIGeneratedBlob
        x={SCREEN_WIDTH * 0.7}
        y={SCREEN_HEIGHT * 0.6}
        size={180}
        scale={blobScale2}
        opacity={blobOpacity2}
        color1={colors.primary + '25'}
        color2={colors.primary + '10'}
      />
      <AIGeneratedBlob
        x={SCREEN_WIDTH * 0.5}
        y={SCREEN_HEIGHT * 0.7}
        size={150}
        scale={blobScale3}
        opacity={blobOpacity3}
        color1={colors.primary + '35'}
        color2={colors.primary + '18'}
      />
      <AIGeneratedBlob
        x={SCREEN_WIDTH * 0.85}
        y={SCREEN_HEIGHT * 0.15}
        size={160}
        scale={blobScale4}
        opacity={blobOpacity4}
        color1={colors.primary + '28'}
        color2={colors.primary + '12'}
      />
      
      {/* Abstract Geometric Shapes */}
      <AbstractShape
        x={SCREEN_WIDTH * 0.3}
        y={SCREEN_HEIGHT * 0.3}
        size={80}
        translateY={shapeTranslateY1}
        rotate={shapeRotate1}
        shape="circle"
      />
      <AbstractShape
        x={SCREEN_WIDTH * 0.65}
        y={SCREEN_HEIGHT * 0.45}
        size={60}
        translateY={shapeTranslateY2}
        rotate={shapeRotate2}
        shape="square"
      />
      <AbstractShape
        x={SCREEN_WIDTH * 0.2}
        y={SCREEN_HEIGHT * 0.75}
        size={70}
        translateY={shapeTranslateY3}
        rotate={shapeRotate3}
        shape="circle"
      />
      
      {/* Shimmer effect */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: colors.primary + '15',
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      />
      
      {/* Human avatars - positioned around the screen with rotation */}
      <HumanAvatar emoji="👤" x={SCREEN_WIDTH * 0.15} y={SCREEN_HEIGHT * 0.2} translateY={translateY1} scale={pulseAnim} rotate={rotate1} index={0} />
      <HumanAvatar emoji="👥" x={SCREEN_WIDTH * 0.8} y={SCREEN_HEIGHT * 0.25} translateY={translateY2} scale={pulseAnim} rotate={rotate2} index={1} />
      <HumanAvatar emoji="👤" x={SCREEN_WIDTH * 0.2} y={SCREEN_HEIGHT * 0.6} translateY={translateY3} scale={pulseAnim} rotate={rotate3} index={2} />
      <HumanAvatar emoji="👥" x={SCREEN_WIDTH * 0.75} y={SCREEN_HEIGHT * 0.65} translateY={translateY4} scale={pulseAnim} rotate={rotate1} index={3} />
      <HumanAvatar emoji="👤" x={SCREEN_WIDTH * 0.5} y={SCREEN_HEIGHT * 0.4} translateY={translateY5} scale={pulseAnim} rotate={rotate2} index={4} />
      
      {/* Connecting lines between avatars with glow */}
      <ConnectingLine
        startX={SCREEN_WIDTH * 0.15}
        startY={SCREEN_HEIGHT * 0.2}
        endX={SCREEN_WIDTH * 0.5}
        endY={SCREEN_HEIGHT * 0.4}
        opacity={lineOpacity1}
        glowOpacity={glowOpacity}
      />
      <ConnectingLine
        startX={SCREEN_WIDTH * 0.8}
        startY={SCREEN_HEIGHT * 0.25}
        endX={SCREEN_WIDTH * 0.5}
        endY={SCREEN_HEIGHT * 0.4}
        opacity={lineOpacity2}
        glowOpacity={glowOpacity}
      />
      <ConnectingLine
        startX={SCREEN_WIDTH * 0.2}
        startY={SCREEN_HEIGHT * 0.6}
        endX={SCREEN_WIDTH * 0.75}
        endY={SCREEN_HEIGHT * 0.65}
        opacity={lineOpacity3}
        glowOpacity={glowOpacity}
      />
      
      {/* Privacy icons (locks/shields) with enhanced glow */}
      <PrivacyIcon icon="🔒" x={SCREEN_WIDTH * 0.1} y={SCREEN_HEIGHT * 0.35} scale={lockScale1} />
      <PrivacyIcon icon="🛡️" x={SCREEN_WIDTH * 0.85} y={SCREEN_HEIGHT * 0.5} scale={lockScale2} />
      <PrivacyIcon icon="🔐" x={SCREEN_WIDTH * 0.5} y={SCREEN_HEIGHT * 0.15} scale={lockScale3} />
      
      {/* Floating particles for 3D effect with varying sizes */}
      {particleAnims.map((particle, i) => {
        const translateY = particle.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SCREEN_HEIGHT * 1.5],
        });
        
        const opacity = particle.anim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 0.8, 0.8, 0],
        });
        
        const scale = particle.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.5],
        });
        
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                transform: [{ translateY }, { scale }],
                opacity,
                backgroundColor: colors.primary + '50',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_HEIGHT,
    opacity: 0.3,
  },
  avatar: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  connectingLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: 'rgba(138, 43, 226, 0.5)',
    borderRadius: 1.5,
  },
  lineGlow: {
    position: 'absolute',
    width: '100%',
    height: 8,
    borderRadius: 4,
    top: -2.5,
    left: 0,
  },
  lineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    right: 0,
    top: -2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  lineMovingDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    right: 0,
    top: -1.5,
  },
  privacyIcon: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.5,
  },
  privacyIconText: {
    fontSize: 28,
  },
  particle: {
    position: 'absolute',
  },
  aiBlob: {
    position: 'absolute',
    overflow: 'hidden',
  },
  blobInner: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 1000,
    top: '15%',
    left: '15%',
    opacity: 0.8,
  },
  blobOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    opacity: 0.6,
  },
  abstractShape: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapeInner: {
    width: '80%',
    height: '80%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(99, 102, 241, 0.4)',
  },
});

export default AnimatedBackground;

