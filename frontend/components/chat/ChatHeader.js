import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

const ProfileDropdown = ({ onProfilePress, onLogoutPress, onClose }) => {
  return (
    <Modal
      transparent={true}
      visible={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={() => {
              onClose();
              onProfilePress();
            }}
          >
            <Text style={styles.dropdownItemText}>👤 Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={() => {
              onClose();
              // Settings - can be implemented later
            }}
          >
            <Text style={styles.dropdownItemText}>⚙️ Settings</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={[styles.dropdownItem, styles.logoutItem]}
            onPress={() => {
              onClose();
              onLogoutPress();
            }}
          >
            <Text style={[styles.dropdownItemText, styles.logoutText]}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const ChatHeader = ({ username, isOnline = true, onProfilePress, onLogoutPress, onSidebarPress }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBackground} />
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity 
            onPress={onSidebarPress}
            style={styles.sidebarButton}
          >
            <Text style={styles.sidebarButtonText}>☰</Text>
          </TouchableOpacity>
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
          <TouchableOpacity 
            onPress={() => setShowDropdown(true)} 
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {showDropdown && (
        <ProfileDropdown
          onProfilePress={onProfilePress}
          onLogoutPress={onLogoutPress}
          onClose={() => setShowDropdown(false)}
        />
      )}
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
  sidebarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sidebarButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  profileButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : StatusBar.currentHeight + 60,
    paddingRight: SPACING.md,
  },
  dropdownContainer: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 180,
    paddingVertical: SPACING.xs,
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
  dropdownItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dropdownItemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },
  logoutItem: {
    // Logout styling
  },
  logoutText: {
    color: '#EF4444', // Red color for logout
  },
});

export default ChatHeader;
