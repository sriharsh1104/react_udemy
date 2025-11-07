import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

const ChatHeader = ({ username, isOnline = true }) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBackground} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{username || 'Chat'}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                <Text style={styles.subtitle}>
                  {isOnline ? 'online' : 'offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.headerBackground,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.headerText,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.offline,
    marginRight: SPACING.xs,
  },
  statusDotOnline: {
    backgroundColor: COLORS.online,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'lowercase',
  },
});

export default ChatHeader;
