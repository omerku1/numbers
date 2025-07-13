import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Trophy, Settings, Brain, Zap, Target, Clock } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  withSequence,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  
  // Floating animations
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const pulse = useSharedValue(0);
  
  React.useEffect(() => {
    float1.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
    float2.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
    float3.value = withRepeat(withTiming(1, { duration: 3500 }), -1, true);
    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.8, { duration: 1000 })
    ), -1, true);
  }, []);

  const floatingStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float1.value, [0, 1], [0, -20]) }],
  }));

  const floatingStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float2.value, [0, 1], [0, -15]) }],
  }));

  const floatingStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float3.value, [0, 1], [0, -25]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
  }));

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      {/* Floating background elements */}
      <Animated.View style={[styles.floatingElement, styles.element1, floatingStyle1]}>
        <Text style={styles.floatingNumber}>42</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.element2, floatingStyle2]}>
        <Text style={styles.floatingNumber}>∑</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.element3, floatingStyle3]}>
        <Text style={styles.floatingNumber}>π</Text>
      </Animated.View>

      {/* Header Section */}
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.iconGradient}
          >
            <Brain size={50} color="white" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.title}>Numbers Game</Text>
        <Text style={styles.subtitle}>Master Math Under Pressure</Text>
        <View style={styles.tagline}>
          <Zap size={16} color="#FFD700" />
          <Text style={styles.taglineText}>Think Fast • Choose Correctly • Survive</Text>
        </View>
      </View>

      {/* Main Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push('/gameMode')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.playGradient}
          >
            <Play size={24} color="white" fill="white" />
            <Text style={styles.playButtonText}>Start Challenge</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/leaderboard')}
          >
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 193, 7, 0.1)']}
              style={styles.secondaryGradient}
            >
              <Trophy size={20} color="#FFD700" />
              <Text style={styles.secondaryButtonText}>Champions</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/settings')}
          >
            <LinearGradient
              colors={['rgba(108, 117, 125, 0.2)', 'rgba(73, 80, 87, 0.1)']}
              style={styles.secondaryGradient}
            >
              <Settings size={20} color="#6C757D" />
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.statsContainer}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2,847</Text>
            <Text style={styles.statLabel}>Best Score</Text>
            <View style={styles.statIcon}>
              <Trophy size={14} color="#FFD700" />
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Level 12</Text>
            <Text style={styles.statLabel}>Peak Level</Text>
            <View style={styles.statIcon}>
              <Target size={14} color="#667eea" />
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>Games Won</Text>
            <View style={styles.statIcon}>
              <Clock size={14} color="#28a745" />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Ready to challenge your mind?</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  element1: {
    top: 100,
    right: 30,
  },
  element2: {
    top: 200,
    left: 20,
  },
  element3: {
    top: 350,
    right: 50,
  },
  floatingNumber: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'Menlo',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Menlo',
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  taglineText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    marginBottom: 30,
    gap: 16,
  },
  playButton: {
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  playGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  playButtonSubtext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
  },
  secondaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statIcon: {
    position: 'absolute',
    top: -6,
    right: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
});