import React, { useState } from 'react';
import { View, Text, Platform, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '../../../constants';
import styles from './ChatHeader.styles';

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

export default ChatHeader;

