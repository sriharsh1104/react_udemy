import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { applyWebPatches } from './utils/webPatches';
import AppContentWithNotifications from './components/AppContentWithNotifications';

// Apply web patches before app initialization
applyWebPatches();

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContentWithNotifications />
      </NotificationProvider>
    </ThemeProvider>
  );
}
