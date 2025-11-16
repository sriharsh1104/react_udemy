import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

const ProfileDropdown = ({ onProfilePress, onSettingsPress, onLogoutPress, onClose, showChatOptions = false, onClearChat, onGroupInfoPress, onContactInfoPress, isGroup = false, onShowReferralLink }) => {
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
          {showChatOptions ? (
            <>
              {/* Chat-specific options */}
              {isGroup && onGroupInfoPress && (
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    onClose();
                    onGroupInfoPress();
                  }}
                >
                  <Text style={styles.dropdownItemText}>ℹ️ Group Info</Text>
                </TouchableOpacity>
              )}
              
              {!isGroup && onContactInfoPress && (
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    onClose();
                    onContactInfoPress();
                  }}
                >
                  <Text style={styles.dropdownItemText}>ℹ️ Contact Info</Text>
                </TouchableOpacity>
              )}
              
              {onClearChat && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity 
                    style={[styles.dropdownItem, styles.destructiveItem]}
                    onPress={() => {
                      onClose();
                      onClearChat();
                    }}
                  >
                    <Text style={[styles.dropdownItemText, styles.destructiveText]}>🗑️ Clear Chat</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <>
              {/* Main menu options (when not in chat) */}
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
                  onSettingsPress();
                }}
              >
                <Text style={styles.dropdownItemText}>⚙️ Settings</Text>
              </TouchableOpacity>
              
              {onShowReferralLink && (
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    onClose();
                    onShowReferralLink();
                  }}
                >
                  <Text style={styles.dropdownItemText}>🎁 Referral Link</Text>
                </TouchableOpacity>
              )}
              
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
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const ChatHeader = ({ username, isOnline = true, onProfilePress, onSettingsPress, onLogoutPress, onSidebarPress, onBackPress, showBackButton = false, isGroup = false, onGroupInfoPress, onContactInfoPress, onClearChat, hideUsername = false, onStatusToggle, onAudioCall, onVideoCall, onShowReferralLink, onBillSummaryPress }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusPress = () => {
    if (onStatusToggle && !isGroup) {
      onStatusToggle();
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBackground} />
      <View style={styles.container}>
        <View style={styles.content}>
          {showBackButton ? (
            <TouchableOpacity 
              onPress={onBackPress}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={onSidebarPress}
              style={styles.sidebarButton}
            >
              <Text style={styles.sidebarButtonText}>☰</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={isGroup && onGroupInfoPress ? onGroupInfoPress : (!isGroup && onContactInfoPress ? onContactInfoPress : undefined)}
            disabled={isGroup ? (!onGroupInfoPress) : (!onContactInfoPress)}
            activeOpacity={(isGroup && onGroupInfoPress) || (!isGroup && onContactInfoPress) ? 0.7 : 1}
          >
            {!hideUsername && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {isGroup ? '👥' : (username ? username.charAt(0).toUpperCase() : 'U')}
                </Text>
              </View>
            )}
            <View style={styles.textContainer}>
              {!hideUsername && (
                <Text style={styles.title} numberOfLines={1}>{username || 'Chat'}</Text>
              )}
              <TouchableOpacity 
                style={styles.statusContainer}
                onPress={handleStatusPress}
                disabled={isGroup || !onStatusToggle}
                activeOpacity={onStatusToggle && !isGroup ? 0.7 : 1}
              >
                {!isGroup && (
                  <>
                <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                <Text style={styles.subtitle}>
                  {isOnline ? 'online' : 'offline'}
                </Text>
                  </>
                )}
                {isGroup && (
                  <Text style={styles.subtitle}>
                    Tap to view group info
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          {showBackButton && (
            <View style={styles.callButtonsContainer}>
              {onAudioCall && (
                <TouchableOpacity 
                  onPress={onAudioCall}
                  style={styles.callButton}
                >
                  <Text style={styles.callButtonText}>📞</Text>
                </TouchableOpacity>
              )}
              {onVideoCall && (
                <TouchableOpacity 
                  onPress={onVideoCall}
                  style={styles.callButton}
                >
                  <Text style={styles.callButtonText}>📹</Text>
                </TouchableOpacity>
              )}
              {onBillSummaryPress && (
                <TouchableOpacity 
                  onPress={onBillSummaryPress}
                  style={styles.callButton}
                >
                  <Text style={styles.callButtonText}>💰</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TouchableOpacity 
            onPress={() => setShowDropdown(true)} 
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>
              ⋮
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {showDropdown && (
        <ProfileDropdown
          onProfilePress={onProfilePress}
          onSettingsPress={onSettingsPress}
          onLogoutPress={onLogoutPress}
          onClose={() => setShowDropdown(false)}
          showChatOptions={showBackButton}
          onClearChat={onClearChat}
          onGroupInfoPress={onGroupInfoPress}
          onContactInfoPress={onContactInfoPress}
          isGroup={isGroup}
          onShowReferralLink={onShowReferralLink}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
  profileButtonText: {
    fontSize: 24,
    color: COLORS.headerText,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  callButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  callButtonText: {
    fontSize: 18,
    color: COLORS.white,
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
  destructiveItem: {
    // Destructive action styling
  },
  destructiveText: {
    color: '#EF4444', // Red color for destructive actions
  },
});

export default ChatHeader;
