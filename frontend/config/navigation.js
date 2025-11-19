/**
 * Navigation linking configuration for URL-based routing on web
 */
export const navigationLinking = {
  prefixes: ['/'],
  config: {
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
  },
};

/**
 * Reset browser title to "onlygossips247" on navigation change (web only)
 */
export const handleNavigationStateChange = () => {
  if (typeof document !== 'undefined') {
    document.title = 'onlygossips247';
  }
};

