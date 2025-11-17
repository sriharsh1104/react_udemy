/**
 * BottomTabBar Component
 * Reusable bottom navigation bar
 */

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';

const BottomTabBar = ({ currentRouteName, navigation, colors }) => {
  return (
    <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.tabButton, currentRouteName === 'Chat' && styles.activeTabButton]}
        onPress={() => navigation.navigate('Chat')}
      >
        <Text style={[styles.tabIcon, currentRouteName === 'Chat' && styles.activeTabIcon]}>💬</Text>
        <Text style={[styles.tabLabel, currentRouteName === 'Chat' && styles.activeTabLabel, { color: currentRouteName === 'Chat' ? colors.primary : colors.textSecondary }]}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, currentRouteName === 'Feed' && styles.activeTabButton]}
        onPress={() => navigation.navigate('Feed')}
      >
        <Text style={[styles.tabIcon, currentRouteName === 'Feed' && styles.activeTabIcon]}>📰</Text>
        <Text style={[styles.tabLabel, currentRouteName === 'Feed' && styles.activeTabLabel, { color: currentRouteName === 'Feed' ? colors.primary : colors.textSecondary }]}>Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, currentRouteName === 'Status' && styles.activeTabButton]}
        onPress={() => navigation.navigate('Status')}
      >
        <Text style={[styles.tabIcon, currentRouteName === 'Status' && styles.activeTabIcon]}>📱</Text>
        <Text style={[styles.tabLabel, currentRouteName === 'Status' && styles.activeTabLabel, { color: currentRouteName === 'Status' ? colors.primary : colors.textSecondary }]}>Status</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, currentRouteName === 'Call' && styles.activeTabButton]}
        onPress={() => navigation.navigate('Call')}
      >
        <Text style={[styles.tabIcon, currentRouteName === 'Call' && styles.activeTabIcon]}>📞</Text>
        <Text style={[styles.tabLabel, currentRouteName === 'Call' && styles.activeTabLabel, { color: currentRouteName === 'Call' ? colors.primary : colors.textSecondary }]}>Call</Text>
      </TouchableOpacity>
    </View>
  );
};

BottomTabBar.propTypes = {
  currentRouteName: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
};

export default BottomTabBar;

