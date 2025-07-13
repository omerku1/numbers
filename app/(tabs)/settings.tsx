import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Volume2, VolumeX, Zap, Shield, Info, User, ChartBar as BarChart3, Gamepad2 } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsScreen() {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    hapticsEnabled, 
    setHapticsEnabled, 
    notifications, 
    setNotifications 
  } = useSettings();

  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
  }));

  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange, 
    type = 'switch',
    iconColor = '#667eea'
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
    iconColor?: string;
  }) => (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
      style={styles.settingRow}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#374151', true: '#667eea' }}
          thumbColor={value ? '#F3F4F6' : '#9CA3AF'}
          ios_backgroundColor="#374151"
        />
      )}
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0F0C29', '#24243e', '#302B63']} style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.headerIcon, pulseStyle]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.headerIconGradient}
          >
            <Settings size={32} color="white" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your gaming experience</Text>
      </View>

      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gamepad2 size={18} color="#FFD700" />
            <Text style={styles.sectionTitle}>Game Experience</Text>
          </View>
          
          <SettingRow
            icon={soundEnabled ? <Volume2 size={18} color="#667eea" /> : <VolumeX size={18} color="#9CA3AF" />}
            title="Sound Effects"
            description="Play audio feedback for game actions"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            iconColor="#667eea"
          />
          
          <SettingRow
            icon={<Zap size={18} color="#F59E0B" />}
            title="Haptic Feedback"
            description="Feel vibrations on touch interactions"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            iconColor="#F59E0B"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color="#FFD700" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <SettingRow
            icon={<Shield size={18} color="#8B5CF6" />}
            title="Daily Challenges"
            description="Get notified about new daily challenges"
            value={notifications}
            onValueChange={setNotifications}
            iconColor="#8B5CF6"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color="#FFD700" />
            <Text style={styles.sectionTitle}>Your Statistics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>89</Text>
              <Text style={styles.statLabel}>Games Played</Text>
              <View style={styles.statIcon}>
                <Gamepad2 size={14} color="#667eea" />
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>2,847</Text>
              <Text style={styles.statLabel}>Best Score</Text>
              <View style={styles.statIcon}>
                <BarChart3 size={14} color="#FFD700" />
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>18h 42m</Text>
              <Text style={styles.statLabel}>Time Played</Text>
              <View style={styles.statIcon}>
                <Zap size={14} color="#10B981" />
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>92%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
              <View style={styles.statIcon}>
                <Shield size={14} color="#EF4444" />
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={18} color="#FFD700" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
            style={styles.aboutCard}
          >
            <View style={styles.aboutHeader}>
              <View style={styles.aboutIcon}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.aboutIconGradient}
                >
                  <Info size={20} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.aboutInfo}>
                <Text style={styles.aboutTitle}>Number or Trap</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              </View>
            </View>
            
            <Text style={styles.aboutDescription}>
              Master mathematics under pressure! Test your arithmetic skills with time-based challenges. 
              Choose the correct answer from 4 options before time runs out. 
              Perfect for sharpening your mental math while having fun!
            </Text>

            <View style={styles.aboutFeatures}>
              <Text style={styles.featuresTitle}>Key Features:</Text>
              <Text style={styles.featureItem}>• Configurable time limits (3-10 seconds)</Text>
              <Text style={styles.featureItem}>• Progressive difficulty system</Text>
              <Text style={styles.featureItem}>• Real-time combo multipliers</Text>
              <Text style={styles.featureItem}>• Global leaderboards</Text>
              <Text style={styles.featureItem}>• Smooth animations & effects</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  aboutCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutIcon: {
    marginRight: 12,
  },
  aboutIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  aboutVersion: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aboutDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 15,
  },
  aboutFeatures: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 6,
  },
  featureItem: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 3,
    lineHeight: 16,
  },
});