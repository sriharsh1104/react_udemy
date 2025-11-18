/**
 * Navigation configuration for React Navigation
 */
export const navigationConfig = {
  prefixes: ['/'],
  screens: {
    Login: '',
    Chat: 'chat',
    Profile: 'profile',
    Settings: 'settings',
    Feed: 'feed',
    Status: 'status',
    Call: 'call',
    Referral: 'referral/:referralCode',
  },
};

