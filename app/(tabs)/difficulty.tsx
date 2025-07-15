import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, Zap, Target, Crown, ArrowLeft, Clock } from 'lucide-react-native';
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

const getDifficultyOptions = (gameMode: 'arithmetic' | 'wordProblem') => {
  if (gameMode === 'wordProblem') {
    return [
      {
        id: 'easy',
        title: 'Easy',
        description: 'Basic word problems',
        subtitle: 'Simple percentages, basic math',
        timeLimit: 20,
        colors: ['#10B981', '#059669'] as const,
        icon: Brain,
        iconColor: '#10B981',
      },
      {
        id: 'medium',
        title: 'Medium',
        description: 'Intermediate scenarios',
        subtitle: 'Fractions, averages, money',
        timeLimit: 15,
        colors: ['#F59E0B', '#D97706'] as const,
        icon: Zap,
        iconColor: '#F59E0B',
      },
      {
        id: 'hard',
        title: 'Hard',
        description: 'Complex problems',
        subtitle: 'Ratios, advanced percentages',
        timeLimit: 12,
        colors: ['#EF4444', '#DC2626'] as const,
        icon: Target,
        iconColor: '#EF4444',
      },
      {
        id: 'legend',
        title: 'Legend',
        description: 'Expert level',
        subtitle: 'Multi-step problems, algebra',
        timeLimit: 10,
        colors: ['#8B5CF6', '#7C3AED'] as const,
        icon: Crown,
        iconColor: '#8B5CF6',
      },
    ];
  } else {
    return [
      {
        id: 'easy',
        title: 'Easy',
        description: '7 seconds per question',
        subtitle: 'Basic operations',
        timeLimit: 7,
        colors: ['#10B981', '#059669'] as const,
        icon: Brain,
        iconColor: '#10B981',
      },
      {
        id: 'medium',
        title: 'Medium',
        description: '5 seconds per question',
        subtitle: 'Mixed operations',
        timeLimit: 5,
        colors: ['#F59E0B', '#D97706'] as const,
        icon: Zap,
        iconColor: '#F59E0B',
      },
      {
        id: 'hard',
        title: 'Hard',
        description: '3 seconds per question',
        subtitle: 'Quick calculations',
        timeLimit: 3,
        colors: ['#EF4444', '#DC2626'] as const,
        icon: Target,
        iconColor: '#EF4444',
      },
      {
        id: 'legend',
        title: 'Legend',
        description: '2 seconds per question',
        subtitle: 'Lightning fast',
        timeLimit: 2,
        colors: ['#8B5CF6', '#7C3AED'] as const,
        icon: Crown,
        iconColor: '#8B5CF6',
      },
    ];
  }
};

export default function DifficultyScreen() {
  const router = useRouter();
  const { setTimeLimit, gameMode } = useSettings();
  
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

  const handleDifficultySelect = (timeLimit: number) => {
    setTimeLimit(timeLimit);
    router.push('/game');
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
        <Text style={styles.floatingNumber}>🎯</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.element3, floatingStyle3]}>
        <Text style={styles.floatingNumber}>👑</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/gameMode')}
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
        
        <Text style={styles.title}>Choose Difficulty</Text>
        <Text style={styles.subtitle}>Select your challenge level</Text>
      </View>

      {/* Difficulty Options */}
      <View style={styles.difficultyContainer}>
        {getDifficultyOptions(gameMode).map((option, index) => {
          const IconComponent = option.icon;
          return (
            <TouchableOpacity
              key={option.id}
              style={styles.difficultyButton}
              onPress={() => handleDifficultySelect(option.timeLimit)}
            >
              <LinearGradient
                colors={option.colors}
                style={styles.difficultyGradient}
              >
                <View style={styles.difficultyContent}>
                  <View style={styles.difficultyIcon}>
                    <IconComponent size={28} color="white" />
                  </View>
                  <View style={styles.difficultyText}>
                    <Text style={styles.difficultyTitle}>{option.title}</Text>
                    <View style={styles.timeInfo}>
                      <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.timeText}>{option.description}</Text>
                    </View>
                    {option.subtitle && (
                      <Text style={styles.difficultySubtitle}>{option.subtitle}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Choose wisely - the challenge awaits!</Text>
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  difficultyContainer: {
    flex: 1,
    gap: 16,
  },
  difficultyButton: {
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  difficultyGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  difficultyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  difficultyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  difficultyText: {
    flex: 1,
  },
  difficultyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  difficultySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontStyle: 'italic',
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