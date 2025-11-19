import { lazy } from 'react';

// Lazy load screens for code splitting
export const ChatScreen = lazy(() => import('../screens/ChatScreen/ChatScreen'));
export const LoginScreen = lazy(() => import('../screens/LoginScreen/LoginScreen'));
export const ProfileScreen = lazy(() => import('../screens/ProfileScreen/ProfileScreen'));
export const SettingsScreen = lazy(() => import('../screens/SettingsScreen/SettingsScreen'));
export const ReferralScreen = lazy(() => import('../screens/ReferralScreen/ReferralScreen'));
export const FeedScreen = lazy(() => import('../screens/FeedScreen/FeedScreen'));
export const StatusScreen = lazy(() => import('../screens/StatusScreen/StatusScreen'));
export const CallScreen = lazy(() => import('../screens/CallScreen/CallScreen'));
export const LogoutModal = lazy(() => import('../components/common/LogoutModal'));
export const NotificationContainer = lazy(() => import('../components/common/Notification'));
export const BiometricLockScreen = lazy(() => import('../components/common/BiometricLockScreen'));

