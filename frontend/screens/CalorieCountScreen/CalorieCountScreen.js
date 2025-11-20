import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import useUserEmail from '../../hooks/useUserEmail';
import healthService from '../../services/healthService';
import styles from './styles';

// Try to import Pedometer from expo-sensors
let Pedometer = null;
let isPedometerAvailable = false;
try {
  const expoSensors = require('expo-sensors');
  Pedometer = expoSensors.Pedometer;
  isPedometerAvailable = true;
} catch (error) {
  console.warn('expo-sensors not available. Step counting will be disabled.');
}

const CalorieCountScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const currentRoute = useRoute();
  const { userEmail } = useUserEmail();
  const currentRouteName = currentRoute?.name || 'CalorieCount';

  // Health data state
  const [healthProfile, setHealthProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthProfileComplete, setHealthProfileComplete] = useState(false);

  // Step counter state
  const [steps, setSteps] = useState(0);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [stepSubscription, setStepSubscription] = useState(null);
  const [updatingSteps, setUpdatingSteps] = useState(false);
  const appState = useRef(AppState.currentState);

  // Load health profile
  const loadHealthProfile = useCallback(async () => {
    try {
      setLoading(true);
      const result = await healthService.getHealthProfile();
      if (result.success && result.healthProfile) {
        const profile = result.healthProfile;
        setHealthProfile(profile);
        setSteps(profile.todaySteps || 0);
        setHealthProfileComplete(profile.isHealthProfileComplete || false);
      }
    } catch (error) {
      console.error('Error loading health profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Update steps on server
  const updateStepsOnServer = async (stepCount) => {
    if (updatingSteps) return;
    try {
      setUpdatingSteps(true);
      await healthService.updateSteps(stepCount);
      // Reload health profile to get updated calories
      await loadHealthProfile();
    } catch (error) {
      console.error('Error updating steps on server:', error);
    } finally {
      setUpdatingSteps(false);
    }
  };

  // Initialize pedometer - only if health profile is complete
  const initPedometer = useCallback(async () => {
    if (!isPedometerAvailable || !Pedometer || !healthProfileComplete) {
      return;
    }

    try {
      const available = await Pedometer.isAvailableAsync();
      setPedometerAvailable(available);

      if (available) {
        // Get today's step count when app opens or comes to foreground
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        try {
          // Try to get step count for today (iOS only)
          if (Platform.OS === 'ios') {
            const stepCountResult = await Pedometer.getStepCountAsync(today, now);
            if (stepCountResult && stepCountResult.steps !== undefined) {
              setSteps(stepCountResult.steps);
              updateStepsOnServer(stepCountResult.steps);
            }
          }
        } catch (error) {
          console.warn('Error getting past step count:', error);
        }

        // Watch for step count changes - updates dynamically
        const subscription = Pedometer.watchStepCount((result) => {
          if (result && result.steps !== undefined) {
            setSteps(result.steps);
            // Update steps on server every 50 steps for dynamic calorie updates
            if (result.steps % 50 === 0) {
              updateStepsOnServer(result.steps);
            }
          }
        });

        setStepSubscription(subscription);
      }
    } catch (error) {
      console.error('Error initializing pedometer:', error);
      setPedometerAvailable(false);
    }
  }, [healthProfileComplete, loadHealthProfile]);

  // Handle app state changes for background step tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        healthProfileComplete
      ) {
        // App has come to the foreground, refresh step count (midnight reset check)
        initPedometer();
        loadHealthProfile();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [healthProfileComplete, initPedometer, loadHealthProfile]);

  // Initialize pedometer when health profile is complete
  useEffect(() => {
    if (healthProfileComplete && !stepSubscription) {
      initPedometer();
    }

    return () => {
      if (stepSubscription) {
        stepSubscription.remove();
      }
    };
  }, [healthProfileComplete, initPedometer, stepSubscription]);

  // Load profile on mount
  useEffect(() => {
    loadHealthProfile();
  }, [loadHealthProfile]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadHealthProfile();
      if (healthProfileComplete) {
        initPedometer();
      }
    }, [healthProfileComplete, loadHealthProfile, initPedometer])
  );

  // Refresh on pull
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthProfile();
    if (healthProfileComplete) {
      initPedometer();
    }
  }, [healthProfileComplete, loadHealthProfile, initPedometer]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading health data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If health profile is not complete, show message to complete it in Profile
  if (!healthProfileComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center', minHeight: '80%' }]}
        >
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateIcon, { color: colors.textSecondary }]}>🔥</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Health Profile Not Set Up
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Please complete your health profile in the Profile section to start tracking your health metrics.
            </Text>
            <TouchableOpacity
              style={[styles.navigateButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.navigateButtonText}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Tab Bar */}
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
          <TouchableOpacity
            style={[styles.tabButton, currentRouteName === 'CalorieCount' && styles.activeTabButton]}
            onPress={() => navigation.navigate('CalorieCount')}
          >
            <Text style={[styles.tabIcon, currentRouteName === 'CalorieCount' && styles.activeTabIcon]}>🔥</Text>
            <Text style={[styles.tabLabel, currentRouteName === 'CalorieCount' && styles.activeTabLabel, { color: currentRouteName === 'CalorieCount' ? colors.primary : colors.textSecondary }]}>Health</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Powered by onlygossips247
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bmi = healthProfile?.bmi;
  const bmiCategory = healthProfile?.bmiCategory;
  const idealWeightRange = healthProfile?.idealWeightRange;
  const dailyCalorieAllowance = healthProfile?.dailyCalorieAllowance;
  const caloriesBurnt = healthProfile?.todayCaloriesBurnt || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Health Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Your health metrics and activity
          </Text>
        </View>

        {/* Health Metrics */}
        <View style={[styles.section, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Metrics</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{bmi || '--'}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BMI</Text>
              {bmiCategory && (
                <Text style={[styles.metricCategory, { color: colors.textSecondary }]}>
                  {bmiCategory}
                </Text>
              )}
            </View>

            {idealWeightRange && (
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {idealWeightRange.ideal} kg
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Ideal Weight
                </Text>
                <Text style={[styles.metricRange, { color: colors.textSecondary }]}>
                  Range: {idealWeightRange.min} - {idealWeightRange.max} kg
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Step Counter */}
        <View style={[styles.section, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Step Counter</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Resets daily at 12:00 AM
          </Text>

          <View style={styles.stepCounterCard}>
            <Text style={[styles.stepCount, { color: colors.primary }]}>{steps.toLocaleString()}</Text>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Steps Today</Text>
            {updatingSteps && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.updatingIndicator} />
            )}
            {pedometerAvailable && (
              <Text style={[styles.stepStatus, { color: colors.textSecondary }]}>
                ✓ Tracking active
              </Text>
            )}
          </View>

          {!isPedometerAvailable && (
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Install expo-sensors to enable step counting: npx expo install expo-sensors
            </Text>
          )}
        </View>

        {/* Calories */}
        <View style={[styles.section, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calories</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Calculated from your steps
          </Text>
          
          <View style={styles.calorieRow}>
            <View style={styles.calorieCard}>
              <Text style={[styles.calorieValue, { color: colors.primary }]}>
                {caloriesBurnt.toLocaleString()}
              </Text>
              <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                Calories Burnt Today
              </Text>
            </View>

            {dailyCalorieAllowance && (
              <View style={styles.calorieCard}>
                <Text style={[styles.calorieValue, { color: colors.primary }]}>
                  {dailyCalorieAllowance.toLocaleString()}
                </Text>
                <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                  Daily Allowance
                </Text>
                <Text style={[styles.calorieSubtext, { color: colors.textSecondary }]}>
                  (Based on ideal weight)
                </Text>
              </View>
            )}
          </View>

          {dailyCalorieAllowance && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((caloriesBurnt / dailyCalorieAllowance) * 100, 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.editButtonText}>Edit Health Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
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
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'CalorieCount' && styles.activeTabButton]}
          onPress={() => navigation.navigate('CalorieCount')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'CalorieCount' && styles.activeTabIcon]}>🔥</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'CalorieCount' && styles.activeTabLabel, { color: currentRouteName === 'CalorieCount' ? colors.primary : colors.textSecondary }]}>Health</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Powered by onlygossips247
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CalorieCountScreen;
