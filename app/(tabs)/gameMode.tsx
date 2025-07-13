import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, Clock, BookOpen, ArrowLeft, Zap, Target } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  withSequence,
} from 'react-native-reanimated';
import { useSettings } from '@/hooks/useSettings';

const { width } = Dimensions.get('window');

const gameModes = [
  {
    id: 'timeLimit',
    title: 'Time Limit',
    description: 'Solve math problems against the clock',
    subtitle: 'Quick calculations under pressure',
    colors: ['#667eea', '#764ba2'] as const,
    icon: Clock,
    iconColor: '#667eea',
    features: ['Fast-paced', 'Multiple choice', 'Time pressure'],
  },
  {
    id: 'wordProblem',
    title: 'Word Problems',
    description: 'Solve real-world math scenarios',
    subtitle: 'Practical applications of mathematics',
    colors: ['#10B981', '#059669'] as const,
    icon: BookOpen,
    iconColor: '#10B981',
    features: ['Real-world scenarios', 'Percentage problems', 'Distance & time'],
  },
];

export default function GameModeScreen() {
  const router = useRouter();
  const { setGameMode } = useSettings();
  
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

  const handleGameModeSelect = (mode: 'timeLimit' | 'wordProblem') => {
    setGameMode(mode);
    router.push('/difficulty');
  };

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      {/* Floating background elements */}
      <Animated.View style={[styles.floatingElement, styles.element1, floatingStyle1]}>
        <Text style={styles.floatingNumber}>⚡</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.element2, floatingStyle2]}>
        <Text style={styles.floatingNumber}>📚</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.element3, floatingStyle3]}>
        <Text style={styles.floatingNumber}>🎯</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.iconGradient}
          >
            <Brain size={40} color="white" />
          </LinearGradient>
        </Animated.View>
        
        <Text style={styles.title}>Choose Game Mode</Text>
        <Text style={styles.subtitle}>Select your preferred challenge type</Text>
      </View>

      {/* Game Mode Options */}
      <View style={styles.modeContainer}>
        {gameModes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeButton}
              onPress={() => handleGameModeSelect(mode.id as 'timeLimit' | 'wordProblem')}
            >
              <LinearGradient
                colors={mode.colors}
                style={styles.modeGradient}
              >
                <View style={styles.modeContent}>
                  <View style={styles.modeIcon}>
                    <IconComponent size={32} color="white" />
                  </View>
                  <View style={styles.modeText}>
                    <Text style={styles.modeTitle}>{mode.title}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                    <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                    <View style={styles.featuresContainer}>
                      {mode.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Target size={12} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Choose your adventure!</Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  modeContainer: {
    flex: 1,
    gap: 20,
  },
  modeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modeGradient: {
    padding: 20,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  featuresContainer: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
}); 