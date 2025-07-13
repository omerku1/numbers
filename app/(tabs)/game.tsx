import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Heart, Star, Zap, X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [problem, setProblem] = useState<{ question: string; answer: number }>({ question: '', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [timeLimit, setTimeLimit] = useState(5); // This will be configurable in settings
  
  const timerRef = useRef<NodeJS.Timeout>();
  const maxStrikes = 3;

  // Animation values
  const problemScale = useSharedValue(1);
  const comboGlow = useSharedValue(0);
  const strikeShake = useSharedValue(0);
  const timerPulse = useSharedValue(0);
  
  const problemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: problemScale.value }],
  }));

  const comboAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(comboGlow.value, [0, 1], [0, 0.8]),
    shadowRadius: interpolate(comboGlow.value, [0, 1], [0, 20]),
  }));

  const strikeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: strikeShake.value }],
  }));

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(timerPulse.value, [0, 1], [1, 1.1]) }],
  }));

  const generateProblem = () => {
    const operations = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let a, b, answer, question;

    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * (20 + level * 5)) + 1;
        b = Math.floor(Math.random() * (20 + level * 5)) + 1;
        answer = a + b;
        question = `${a} + ${b}`;
        break;
      case '-':
        a = Math.floor(Math.random() * (30 + level * 5)) + 15;
        b = Math.floor(Math.random() * (a - 1)) + 1;
        answer = a - b;
        question = `${a} - ${b}`;
        break;
      case '×':
        a = Math.floor(Math.random() * (6 + Math.floor(level / 2))) + 1;
        b = Math.floor(Math.random() * (6 + Math.floor(level / 2))) + 1;
        answer = a * b;
        question = `${a} × ${b}`;
        break;
      case '÷':
        answer = Math.floor(Math.random() * (8 + level)) + 1;
        a = answer * (Math.floor(Math.random() * (6 + Math.floor(level / 2))) + 1);
        question = `${a} ÷ ${a / answer}`;
        break;
      default:
        a = 1; b = 1; answer = 2; question = '1 + 1';
    }

    return { question, answer };
  };

  const generateOptions = (correctAnswer: number) => {
    const options = [correctAnswer];
    const range = Math.max(3, Math.floor(correctAnswer * 0.3));
    
    while (options.length < 4) {
      let distractor;
      if (Math.random() < 0.5) {
        distractor = correctAnswer + (Math.floor(Math.random() * range) + 1);
      } else {
        distractor = correctAnswer - (Math.floor(Math.random() * range) + 1);
      }
      
      if (distractor !== correctAnswer && distractor > 0 && !options.includes(distractor)) {
        options.push(distractor);
      }
    }
    
    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
  };

  const nextProblem = () => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setOptions(generateOptions(newProblem.answer));
    setTimeLeft(timeLimit);
    
    // Animate problem change
    problemScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleAnswer = (selectedAnswer: number) => {
    if (gameState !== 'playing') return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const isCorrect = selectedAnswer === problem.answer;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (isCorrect) {
      // Correct answer
      const comboBonus = Math.floor(combo / 5) * 100;
      const levelBonus = level * 25;
      const timeBonus = timeLeft * 10;
      const points = 150 + comboBonus + levelBonus + timeBonus;
      
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      
      // Combo glow effect
      if (combo > 0 && combo % 5 === 0) {
        comboGlow.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
      }
      
      // Level up check
      if (score > 0 && (score + points) % 1000 < score % 1000) {
        setLevel(prev => prev + 1);
      }
      
      // Move to next problem
      setTimeout(() => nextProblem(), 500);
      
    } else {
      // Wrong answer - strike
      setStrikes(prev => {
        const newStrikes = prev + 1;
        if (newStrikes >= maxStrikes) {
          setGameState('gameOver');
        }
        return newStrikes;
      });
      setCombo(0);
      
      // Strike shake animation
      strikeShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Move to next problem after wrong answer
      setTimeout(() => nextProblem(), 1000);
    }
  };

  const handleTimeUp = () => {
    // Time's up - strike and move to next problem
    setStrikes(prev => {
      const newStrikes = prev + 1;
      if (newStrikes >= maxStrikes) {
        setGameState('gameOver');
      }
      return newStrikes;
    });
    setCombo(0);
    
    // Strike shake animation
    strikeShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    
    // Move to next problem
    setTimeout(() => nextProblem(), 1000);
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            runOnJS(handleTimeUp)();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Timer pulse animation when time is running low
      if (timeLeft <= 3) {
        timerPulse.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, gameState]);

  // Initialize first problem
  useEffect(() => {
    nextProblem();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (gameState === 'gameOver') {
    return (
      <LinearGradient colors={['#0F0C29', '#24243e', '#302B63']} style={styles.container}>
        <View style={styles.gameOverContainer}>
          <View style={styles.gameOverIcon}>
            <X size={60} color="#EF4444" />
          </View>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          <Text style={styles.finalScore}>Final Score: {score.toLocaleString()}</Text>
          <Text style={styles.levelReached}>Level Reached: {level}</Text>
          <Text style={styles.comboReached}>Best Combo: {combo}</Text>
          
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {
              setGameState('playing');
              setScore(0);
              setStrikes(0);
              setLevel(1);
              setCombo(0);
              nextProblem();
            }}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.playAgainGradient}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0C29', '#24243e', '#302B63']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.gameInfo}>
          <Animated.View style={[styles.strikesContainer, strikeAnimatedStyle]}>
            {[...Array(maxStrikes)].map((_, i) => (
              <View key={i} style={styles.strikeItem}>
                {i < strikes ? (
                  <X size={18} color="#EF4444" />
                ) : (
                  <Heart size={18} color="#374151" fill="transparent" />
                )}
              </View>
            ))}
          </Animated.View>
          
          <Animated.View style={[styles.scoreContainer, comboAnimatedStyle]}>
            <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
            {combo >= 5 && (
              <View style={styles.comboContainer}>
                <Zap size={14} color="#FFD700" />
                <Text style={styles.comboText}>{combo}x COMBO!</Text>
              </View>
            )}
          </Animated.View>
          
        </View>
      </View>

      <View style={styles.gameArea}>
        <Animated.View style={[styles.problemContainer, problemAnimatedStyle]}>
          <Text style={styles.problemText}>{problem.question} = ?</Text>
          <View style={styles.levelBadge}>
            <Star size={12} color="#FFD700" />
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
          <Clock size={20} color={timeLeft <= 3 ? "#EF4444" : "#FFD700"} />
          <Text style={[styles.timerText, { color: timeLeft <= 3 ? "#EF4444" : "#FFD700" }]}>
            {timeLeft}s
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(option)}
              disabled={gameState !== 'playing'}
            >
              <LinearGradient
                colors={['#4C1D95', '#7C3AED', '#A855F7']}
                style={styles.optionGradient}
              >
                <Text style={styles.optionText}>{option}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strikesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  strikeItem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    shadowColor: '#667eea',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  comboText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  problemContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  problemText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
  },
  optionButton: {
    width: (width - 60) / 2,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  optionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameOverIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  finalScore: {
    fontSize: 22,
    color: '#667eea',
    marginBottom: 8,
    fontWeight: '600',
  },
  levelReached: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 6,
  },
  comboReached: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  playAgainButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  playAgainGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  homeButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  homeButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});