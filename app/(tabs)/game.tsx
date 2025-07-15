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
import { useRouter, useFocusEffect } from 'expo-router';
import { Heart, Star, Zap, X, Clock, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useGameScores } from '@/hooks/useGameScores';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const router = useRouter();
  const { timeLimit, gameMode, setIsGameActive } = useSettings();
  const { user } = useAuth();
  const { saveGameScore } = useGameScores();
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0); // Track best combo of the session
  const [problem, setProblem] = useState<{ question: string; answer: number }>({ question: '', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(5); // Initialize with default, will be updated when timeLimit changes
  const [answerFeedback, setAnswerFeedback] = useState<{ [key: number]: 'correct' | 'incorrect' | null }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Helper to ensure an answer is a whole number or a multiple of 0.25
  const isQuarterMultiple = (num: number) => {
    return Number.isInteger(Math.round(num * 4));
  };

  const generateProblem = () => {
    if (gameMode === 'wordProblem') {
      return generateWordProblem();
    } else {
      return generateArithmeticProblem();
    }
  };

  const generateArithmeticProblem = () => {
    // Determine which operations are available based on the player's current level (internal stage)
    let operations: string[] = [];
    if (level <= 2) {
      operations = ['+']; // Early – simple two-number addition
    } else if (level <= 4) {
      operations = ['+']; // Intermediate – still addition but with 3+ operands
    } else if (level <= 6) {
      operations = ['+', '-']; // Advanced – introduce subtraction
    } else if (level <= 8) {
      operations = ['+', '-', '×']; // Expert – add multiplication
    } else {
      operations = ['+', '-', '×', '÷']; // Master – full set including division
    }
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let a, b, answer, question;

    // Helper function to generate modulo-5=0 numbers for easy/medium levels
    const generateModulo5Number = (min: number, max: number) => {
      const range = max - min + 1;
      const modulo5Range = Math.floor(range / 5);
      const randomMultiplier = Math.floor(Math.random() * modulo5Range);
      return min + (randomMultiplier * 5);
    };

    // Helper function to generate any number for hard/legend levels
    const generateAnyNumber = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Determine if we should use modulo-5 constraint based on difficulty
    const difficulty = getDifficultyFromTimeLimit(timeLimit);
    const useModulo5 = difficulty === 'easy' || difficulty === 'medium';
    const generateNumber = useModulo5 ? generateModulo5Number : generateAnyNumber;

    switch (operation) {
      case '+':
        // Determine how many numbers to add (2 in early levels, up to 5 later)
        const addCount = level <= 2 ? 2 : Math.min(5, 2 + Math.floor(level / 2));
        const numbers = Array.from({ length: addCount }, () => generateNumber(1, 20 + level * 5));
        answer = numbers.reduce((sum, n) => sum + n, 0);
        question = numbers.join(' + ');
        break;
      case '-':
        a = generateNumber(15, 30 + level * 5);
        b = generateNumber(1, a - 1);
        answer = a - b;
        question = `${a} - ${b}`;
        break;
      case '×':
        a = generateNumber(1, 6 + Math.floor(level / 2));
        b = generateNumber(1, 6 + Math.floor(level / 2));
        answer = a * b;
        question = `${a} × ${b}`;
        break;
      case '÷':
        answer = generateNumber(1, 8 + level);
        a = answer * generateNumber(1, 6 + Math.floor(level / 2));
        question = `${a} ÷ ${a / answer}`;
        break;
      default:
        a = 1; b = 1; answer = 2; question = '1 + 1';
    }

    // Ensure the answer respects the X / .25 / .5 / .75 rule; regenerate if it does not
    if (!isQuarterMultiple(answer)) {
      return generateArithmeticProblem();
    }

    return { question, answer };
  };

  const generateWordProblem = () => {
    const difficulty = getDifficultyFromTimeLimit(timeLimit);
    const problemTypes = getProblemTypesForDifficulty(difficulty);
    const problemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    let question = "", answer = 0;

    switch (problemType) {
      case 'percentage':
        const percentageResult = generatePercentageProblem(difficulty);
        question = percentageResult.question;
        answer = percentageResult.answer;
        break;
      
      case 'distance':
        const distanceResult = generateDistanceProblem(difficulty);
        question = distanceResult.question;
        answer = distanceResult.answer;
        break;
      
      case 'money':
        const moneyResult = generateMoneyProblem(difficulty);
        question = moneyResult.question;
        answer = moneyResult.answer;
        break;
      
      case 'fraction':
        const fractionResult = generateFractionProblem(difficulty);
        question = fractionResult.question;
        answer = fractionResult.answer;
        break;
      
      case 'average':
        const averageResult = generateAverageProblem(difficulty);
        question = averageResult.question;
        answer = averageResult.answer;
        break;
      
      case 'speed':
        const speedResult = generateSpeedProblem(difficulty);
        question = speedResult.question;
        answer = speedResult.answer;
        break;
      
      case 'geometry':
        const geometryResult = generateGeometryProblem(difficulty);
        question = geometryResult.question;
        answer = geometryResult.answer;
        break;
      
      case 'probability':
        const probabilityResult = generateProbabilityProblem(difficulty);
        question = probabilityResult.question;
        answer = probabilityResult.answer;
        break;
      
      case 'sequence':
        const sequenceResult = generateSequenceProblem(difficulty);
        question = sequenceResult.question;
        answer = sequenceResult.answer;
        break;
      
      default:
        question = "What is 50% of 100?";
        answer = 50;
    }

    // Ensure the answer respects the X / .25 / .5 / .75 rule; regenerate if it does not
    if (!isQuarterMultiple(answer)) {
      return generateWordProblem();
    }

    return { question, answer };
  };

  const getDifficultyFromTimeLimit = (timeLimit: number) => {
    if (timeLimit >= 20) return 'easy';
    if (timeLimit >= 15) return 'medium';
    if (timeLimit >= 12) return 'hard';
    return 'legend';
  };

  const getProblemTypesForDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return ['percentage', 'distance', 'money', 'fraction'];
      case 'medium':
        return ['percentage', 'distance', 'money', 'fraction', 'average', 'speed'];
      case 'hard':
        return ['percentage', 'distance', 'money', 'fraction', 'average', 'speed', 'geometry'];
      case 'legend':
        return ['percentage', 'distance', 'money', 'fraction', 'average', 'speed', 'geometry', 'probability', 'sequence'];
      default:
        return ['percentage', 'distance', 'money', 'fraction'];
    }
  };

  const generatePercentageProblem = (difficulty: string) => {
    // Predefined percentages that work well with common numbers
    const cleanPercentages = [10, 15, 20, 25, 30, 33, 40, 50, 60, 66, 70, 75, 80, 90];
    
    let percent, total;
    switch (difficulty) {
      case 'easy':
        // Use simple percentages with numbers that divide evenly
        percent = cleanPercentages[Math.floor(Math.random() * cleanPercentages.length)];
        // For easy level, use only modulo-5=0 numbers
        const easyTotals = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300];
        total = easyTotals[Math.floor(Math.random() * easyTotals.length)];
        break;
      case 'medium':
        percent = cleanPercentages[Math.floor(Math.random() * cleanPercentages.length)];
        // For medium level, use only modulo-5=0 numbers
        const mediumTotals = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500];
        total = mediumTotals[Math.floor(Math.random() * mediumTotals.length)];
        break;
      case 'hard':
        percent = cleanPercentages[Math.floor(Math.random() * cleanPercentages.length)];
        const hardTotals = [200, 240, 250, 300, 320, 360, 400, 450, 480, 500, 600, 640, 720, 800, 900];
        total = hardTotals[Math.floor(Math.random() * hardTotals.length)];
        break;
      case 'legend':
        percent = cleanPercentages[Math.floor(Math.random() * cleanPercentages.length)];
        const legendTotals = [400, 450, 480, 500, 600, 640, 720, 800, 900, 960, 1000, 1200, 1280, 1440, 1600];
        total = legendTotals[Math.floor(Math.random() * legendTotals.length)];
        break;
      default:
        percent = 50;
        total = 100;
    }
    
    // Calculate the exact answer
    const exactAnswer = (percent * total) / 100;
    
    // Verify the answer is a whole number
    if (exactAnswer !== Math.floor(exactAnswer)) {
      // If not, find a better combination that gives a whole number
      const betterPercent = cleanPercentages[Math.floor(Math.random() * cleanPercentages.length)];
      const betterTotal = Math.floor(Math.random() * 20 + 10) * 10; // Multiples of 10
      const betterAnswer = (betterPercent * betterTotal) / 100;
      
      // Ensure it's a whole number
      if (betterAnswer === Math.floor(betterAnswer)) {
        const question = `What is ${betterPercent}% of ${betterTotal}?`;
        return { question, answer: betterAnswer };
      } else {
        // Fallback to a guaranteed whole number
        const fallbackPercent = 50;
        const fallbackTotal = 200;
        const fallbackAnswer = (fallbackPercent * fallbackTotal) / 100;
        const question = `What is ${fallbackPercent}% of ${fallbackTotal}?`;
        return { question, answer: fallbackAnswer };
      }
    }
    
    const question = `What is ${percent}% of ${total}?`;
    return { question, answer: exactAnswer };
  };

  const generateDistanceProblem = (difficulty: string) => {
    let speed, distance, answer;
    const difficultyMultipliers = {
      easy: { speedMax: 20, answerMax: 10 },
      medium: { speedMax: 50, answerMax: 20 },
      hard: { speedMax: 100, answerMax: 30 },
      legend: { speedMax: 150, answerMax: 50 },
    };
    const { speedMax, answerMax } = difficultyMultipliers[difficulty] || difficultyMultipliers['easy'];
    const useModulo5 = difficulty === 'easy' || difficulty === 'medium';

    // 1. Generate a valid answer first (integer or quarter-multiple)
    const wholeAnswer = Math.floor(Math.random() * answerMax) + 1;
    const decimalPart = [0, 0.25, 0.5, 0.75][Math.floor(Math.random() * 4)];
    answer = wholeAnswer + decimalPart;

    // 2. Generate a compatible speed
    if (useModulo5) {
      // Ensure speed is a multiple of 5 and works with the decimal answer
      const possibleSpeeds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100].filter(s => s <= speedMax);
      speed = possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)];
    } else {
      speed = Math.floor(Math.random() * speedMax) + 5;
    }
    
    // In case the answer has a decimal, we need to ensure speed is a multiple of 4
    // to guarantee the resulting distance is an integer.
    if (decimalPart !== 0) {
       speed = (Math.floor(speed / 4) || 1) * 4;
    }

    // 3. Calculate distance to guarantee a valid problem
    distance = speed * answer;
    
    // Ensure distance is also a multiple of 5 for easy/medium if required
    if (useModulo5 && distance % 5 !== 0) {
      // If the calculated distance isn't a multiple of 5, regenerate.
      // This is a rare case but ensures all numbers fit the rules.
      return generateDistanceProblem(difficulty);
    }

    const question = `How many hours will it take to travel ${distance} km at ${speed} km/h?`;
    return { question, answer };
  };

  const generateMoneyProblem = (difficulty: string) => {
    let price, discount, answer;
    switch (difficulty) {
      case 'easy':
        // For easy level, use only modulo-5=0 prices
        const easyPrices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300];
        price = easyPrices[Math.floor(Math.random() * easyPrices.length)];
        discount = Math.floor(Math.random() * 20) + 10; // 10% to 30%
        break;
      case 'medium':
        // For medium level, use only modulo-5=0 prices
        const mediumPrices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500];
        price = mediumPrices[Math.floor(Math.random() * mediumPrices.length)];
        discount = Math.floor(Math.random() * 30) + 10; // 10% to 40%
        break;
      case 'hard':
        price = Math.floor(Math.random() * 150) + 20; // $20 to $170
        discount = Math.floor(Math.random() * 40) + 15; // 15% to 55%
        break;
      case 'legend':
        price = Math.floor(Math.random() * 200) + 50; // $50 to $250
        discount = Math.floor(Math.random() * 50) + 20; // 20% to 70%
        break;
      default:
        price = 50;
        discount = 20;
    }
    const answer2 = Math.round(price * (1 - discount / 100));
    const question = `A $${price} item is ${discount}% off. What is the final price?`;
    return { question, answer2 };
  };

  const generateFractionProblem = (difficulty: string) => {
    // Predefined simplified fractions to avoid ugly ones like 3/6
    const simplifiedFractions = [
      { num: 1, den: 2 }, // 1/2 = 50%
      { num: 1, den: 3 }, // 1/3 ≈ 33%
      { num: 2, den: 3 }, // 2/3 ≈ 67%
      { num: 1, den: 4 }, // 1/4 = 25%
      { num: 3, den: 4 }, // 3/4 = 75%
      { num: 1, den: 5 }, // 1/5 = 20%
      { num: 2, den: 5 }, // 2/5 = 40%
      { num: 3, den: 5 }, // 3/5 = 60%
      { num: 4, den: 5 }, // 4/5 = 80%
      { num: 1, den: 6 }, // 1/6 ≈ 17%
      { num: 5, den: 6 }, // 5/6 ≈ 83%
      { num: 1, den: 8 }, // 1/8 = 12.5%
      { num: 3, den: 8 }, // 3/8 = 37.5%
      { num: 5, den: 8 }, // 5/8 = 62.5%
      { num: 7, den: 8 }, // 7/8 = 87.5%
    ];

    let multiplier;
    switch (difficulty) {
      case 'easy':
        // For easy level, use only modulo-5=0 numbers
        const easyMultipliers = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300];
        multiplier = easyMultipliers[Math.floor(Math.random() * easyMultipliers.length)];
        break;
      case 'medium':
        // For medium level, use only modulo-5=0 numbers
        const mediumMultipliers = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500];
        multiplier = mediumMultipliers[Math.floor(Math.random() * mediumMultipliers.length)];
        break;
      case 'hard':
        // Use larger numbers divisible by various denominators
        const hardMultipliers = [60, 72, 80, 90, 96, 100, 120, 125, 128, 144, 150, 160, 180, 192, 200];
        multiplier = hardMultipliers[Math.floor(Math.random() * hardMultipliers.length)];
        break;
      case 'legend':
        // Use even larger numbers with more complex fractions
        const legendMultipliers = [120, 144, 150, 160, 180, 192, 200, 240, 250, 256, 288, 300, 320, 360, 384, 400];
        multiplier = legendMultipliers[Math.floor(Math.random() * legendMultipliers.length)];
        break;
      default:
        multiplier = 24;
    }

    // Select a random fraction
    const fraction = simplifiedFractions[Math.floor(Math.random() * simplifiedFractions.length)];
    const { num: numerator, den: denominator } = fraction;
    
    // Calculate the exact answer (should be a whole number)
    const answer = (numerator * multiplier) / denominator;
    
    // Verify the answer is a whole number
    if (answer !== Math.floor(answer)) {
      // If not, find a better multiplier that works with this fraction
      const betterMultiplier = denominator * Math.floor(Math.random() * 20 + 5);
      const betterAnswer = (numerator * betterMultiplier) / denominator;
      const question = `What is ${numerator}/${denominator} of ${betterMultiplier}?`;
      return { question, answer: betterAnswer };
    }

    const question = `What is ${numerator}/${denominator} of ${multiplier}?`;
    return { question, answer };
  };

  const generateAverageProblem = (difficulty: string) => {
    let numbers;
    
    // Helper function to generate modulo-5=0 numbers
    const generateModulo5Number = (min: number, max: number) => {
      const range = max - min + 1;
      const modulo5Range = Math.floor(range / 5);
      const randomMultiplier = Math.floor(Math.random() * modulo5Range);
      return min + (randomMultiplier * 5);
    };
    
    // Helper function to generate any number
    const generateAnyNumber = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    switch (difficulty) {
      case 'easy':
        // For easy level, use only modulo-5=0 numbers
        numbers = [
          generateModulo5Number(10, 40),
          generateModulo5Number(10, 40),
          generateModulo5Number(10, 40)
        ];
        break;
      case 'medium':
        // For medium level, use only modulo-5=0 numbers
        numbers = [
          generateModulo5Number(10, 60),
          generateModulo5Number(10, 60),
          generateModulo5Number(10, 60),
          generateModulo5Number(10, 60)
        ];
        break;
      case 'hard':
        numbers = [
          generateAnyNumber(20, 100),
          generateAnyNumber(20, 100),
          generateAnyNumber(20, 100),
          generateAnyNumber(20, 100),
          generateAnyNumber(20, 100)
        ];
        break;
      case 'legend':
        numbers = [
          generateAnyNumber(30, 130),
          generateAnyNumber(30, 130),
          generateAnyNumber(30, 130),
          generateAnyNumber(30, 130),
          generateAnyNumber(30, 130),
          generateAnyNumber(30, 130)
        ];
        break;
      default:
        numbers = [10, 20, 30];
    }
    const answer = Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
    const question = `What is the average of ${numbers.join(', ')}?`;
    return { question, answer };
  };

  const generateSpeedProblem = (difficulty: string) => {
    let speed, time, distance;
    switch (difficulty) {
      case 'easy':
        // For easy level, use only modulo-5=0 speeds
        const easySpeeds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
        speed = easySpeeds[Math.floor(Math.random() * easySpeeds.length)];
        time = Math.floor(Math.random() * 4) + 2; // 2 to 5 hours
        break;
      case 'medium':
        // For medium level, use only modulo-5=0 speeds
        const mediumSpeeds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150];
        speed = mediumSpeeds[Math.floor(Math.random() * mediumSpeeds.length)];
        time = Math.floor(Math.random() * 6) + 2; // 2 to 7 hours
        break;
      case 'hard':
        speed = Math.floor(Math.random() * 15) + 8; // 8 to 22 km/h
        time = Math.floor(Math.random() * 8) + 3; // 3 to 10 hours
        break;
      case 'legend':
        speed = Math.floor(Math.random() * 20) + 10; // 10 to 29 km/h
        time = Math.floor(Math.random() * 10) + 4; // 4 to 13 hours
        break;
      default:
        speed = 10;
        time = 3;
    }
    distance = speed * time;
    const question = `If you travel at ${speed} km/h for ${time} hours, how many kilometers will you cover?`;
    return { question, answer: distance };
  };

  const generateGeometryProblem = (difficulty: string) => {
    let answer;
    switch (difficulty) {
      case 'hard':
        // For hard level, use any numbers
        const side = Math.floor(Math.random() * 10) + 5;
        answer = side * side;
        const question = `What is the area of a square with side length ${side}?`;
        return { question, answer };
      case 'legend':
        // For legend level, use any numbers
        const length = Math.floor(Math.random() * 15) + 5;
        const width = Math.floor(Math.random() * 10) + 3;
        answer = length * width;
        const question2 = `What is the area of a rectangle with length ${length} and width ${width}?`;
        return { question: question2, answer };
      default:
        answer = 25;
        const question3 = "What is the area of a square with side length 5?";
        return { question: question3, answer };
    }
  };

  const generateProbabilityProblem = (difficulty: string) => {
    let answer;
    switch (difficulty) {
      case 'legend':
        // For legend level, use any numbers
        const total = Math.floor(Math.random() * 20) + 10;
        const favorable = Math.floor(Math.random() * (total - 1)) + 1;
        answer = Math.round((favorable / total) * 100);
        const question = `In a bag of ${total} marbles, ${favorable} are red. What is the probability of drawing a red marble (as a percentage)?`;
        return { question, answer };
      default:
        answer = 50;
        const question2 = "In a bag of 10 marbles, 5 are red. What is the probability of drawing a red marble (as a percentage)?";
        return { question: question2, answer };
    }
  };

  const generateSequenceProblem = (difficulty: string) => {
    let answer;
    switch (difficulty) {
      case 'legend':
        // For legend level, use any numbers
        const start = Math.floor(Math.random() * 10) + 1;
        const step = Math.floor(Math.random() * 5) + 2;
        const position = Math.floor(Math.random() * 5) + 3;
        answer = start + (step * (position - 1));
        const question = `In the sequence ${start}, ${start + step}, ${start + step * 2}, ..., what is the ${position}th number?`;
        return { question, answer };
      default:
        answer = 7;
        const question2 = "In the sequence 1, 3, 5, 7, ..., what is the 4th number?";
        return { question: question2, answer };
    }
  };

  const generateOptions = (correctAnswer: number) => {
    const options = [correctAnswer];
    
    // Check if the answer is a decimal (for distance problems)
    const isDecimal = correctAnswer % 1 !== 0;
    
    if (isDecimal) {
      // For decimal answers, create options with similar decimals
      const wholePart = Math.floor(correctAnswer);
      const decimalPart = correctAnswer - wholePart;
      
      // Create distractors with different decimals
      const decimalOptions = [0.25, 0.5, 0.75];
      const otherDecimals = decimalOptions.filter(d => d !== decimalPart);
      
      while (options.length < 4) {
        let distractor;
        if (Math.random() < 0.5) {
          // Same whole number, different decimal
          const randomDecimal = otherDecimals[Math.floor(Math.random() * otherDecimals.length)];
          distractor = wholePart + randomDecimal;
        } else {
          // Different whole number, same or different decimal
          const wholeDiff = Math.random() < 0.5 ? 1 : -1;
          const randomDecimal = decimalOptions[Math.floor(Math.random() * decimalOptions.length)];
          distractor = wholePart + wholeDiff + randomDecimal;
        }
        
        if (distractor !== correctAnswer && distractor > 0 && !options.includes(distractor)) {
          options.push(distractor);
        }
      }
    } else {
      // For whole number answers, use the original logic
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
    }
    
    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
  };

  const nextProblem = () => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setOptions(generateOptions(newProblem.answer));
    
    // Reset feedback state
    setAnswerFeedback({});
    setShowFeedback(false);
    
    // Set time based on game mode
    const timeForProblem = gameMode === 'wordProblem' ? Math.max(15, timeLimit * 2) : timeLimit;
    setTimeLeft(timeForProblem);
    
    // Animate problem change
    problemScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const saveScore = async () => {
    if (!user) return;

    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    
    await saveGameScore({
      score,
      level_reached: level,
      best_combo: bestCombo,
      game_mode: gameMode,
      time_limit: timeLimit,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      game_duration: gameDuration,
    });
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
      setCorrectAnswers(prev => prev + 1);
      const comboBonus = Math.floor(combo / 5) * 100;
      const levelBonus = level * 25;
      const timeBonus = timeLeft * 10;
      const points = 150 + comboBonus + levelBonus + timeBonus;
      
      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        // Update best combo if current combo is higher
        setBestCombo(currentBest => Math.max(currentBest, newCombo));
        return newCombo;
      });
      
      // Show correct answer feedback
      setAnswerFeedback({
        [selectedAnswer]: 'correct'
      });
      setShowFeedback(true);
      
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
      setTimeout(() => {
        setShowFeedback(false);
        setAnswerFeedback({});
        nextProblem();
      }, 800);
      
    } else {
      // Wrong answer - strike
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      setCombo(0);
      
      // Show answer feedback
      setAnswerFeedback({
        [selectedAnswer]: 'incorrect',
        [problem.answer]: 'correct'
      });
      setShowFeedback(true);
      
      // Strike shake animation
      strikeShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Check if this is the final strike (game over)
      if (newStrikes >= maxStrikes) {
        // Show feedback for longer before game over
        setTotalQuestions(prev => prev + 1);
        setTimeout(() => {
          setShowFeedback(false);
          setAnswerFeedback({});
          saveScore();
          setGameState('gameOver');
        }, 2000); // Show feedback for 2 seconds before game over
      } else {
        // Move to next problem after wrong answer (not game over)
        setTotalQuestions(prev => prev + 1);
        setTimeout(() => {
          setShowFeedback(false);
          setAnswerFeedback({});
          nextProblem();
        }, 1500);
      }
    }
  };

  const handleTimeUp = () => {
    // Time's up - strike and move to next problem
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    setCombo(prev => {
      // Update best combo before resetting
      setBestCombo(currentBest => Math.max(currentBest, prev));
      return 0;
    });
    
    // Show answer feedback for time up
    setAnswerFeedback({
      [problem.answer]: 'correct'
    });
    setShowFeedback(true);
    
    // Strike shake animation
    strikeShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    
    // Check if this is the final strike (game over)
    if (newStrikes >= maxStrikes) {
      // Show feedback for longer before game over
      setTotalQuestions(prev => prev + 1);
      setTimeout(() => {
        setShowFeedback(false);
        setAnswerFeedback({});
        saveScore();
        setGameState('gameOver');
      }, 2000); // Show feedback for 2 seconds before game over
    } else {
      // Move to next problem after time up (not game over)
      setTotalQuestions(prev => prev + 1);
      setTimeout(() => {
        setShowFeedback(false);
        setAnswerFeedback({});
        nextProblem();
      }, 1500);
    }
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
      }, 1000) as unknown as NodeJS.Timeout;

      // Timer pulse animation when time is running low
      const warningThreshold = gameMode === 'wordProblem' ? 5 : 3;
      if (timeLeft <= warningThreshold) {
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

  // Update timeLeft when timeLimit changes
  useEffect(() => {
    const timeForProblem = gameMode === 'wordProblem' ? Math.max(15, timeLimit * 2) : timeLimit;
    setTimeLeft(timeForProblem);
  }, [timeLimit, gameMode]);

  // Initialize first problem and reset game state
  useEffect(() => {
    // Reset game state when component mounts
    setGameState('playing');
    setScore(0);
    setStrikes(0);
    setLevel(1);
    setCombo(0);
    setBestCombo(0);
    setAnswerFeedback({});
    setShowFeedback(false);
    setGameStartTime(Date.now());
    setTotalQuestions(0);
    setCorrectAnswers(0);
    
    nextProblem();
    setIsGameActive(true); // Set game as active when starting
  }, []);

  // Ensure game is active when component is focused
  useFocusEffect(
    React.useCallback(() => {
      if (gameState === 'playing') {
        setIsGameActive(true);
      }
    }, [gameState])
  );

  // Reset game state when game mode changes
  useEffect(() => {
    // Reset game state when game mode changes
    setGameState('playing');
    setScore(0);
    setStrikes(0);
    setLevel(1);
    setCombo(0);
    setBestCombo(0);
    setAnswerFeedback({});
    setShowFeedback(false);
    
    nextProblem();
    setIsGameActive(true);
  }, [gameMode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsGameActive(false); // Clear game active state on unmount
    };
  }, []);

  // Set game as inactive when game over
  useEffect(() => {
    if (gameState === 'gameOver') {
      setIsGameActive(false);
    }
  }, [gameState]);

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
          <Text style={styles.comboReached}>Best Combo: {bestCombo}</Text>
          
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {
              setGameState('playing');
              setScore(0);
              setStrikes(0);
              setLevel(1);
              setCombo(0);
              setBestCombo(0); // Reset best combo for new game
              setIsGameActive(true); // Set game as active for new game
              setGameStartTime(Date.now());
              setTotalQuestions(0);
              setCorrectAnswers(0);
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
            onPress={() => {
              // Reset game state when going back to home
              setGameState('playing');
              setScore(0);
              setStrikes(0);
              setLevel(1);
              setCombo(0);
              setBestCombo(0);
              setAnswerFeedback({});
              setShowFeedback(false);
              setIsGameActive(false);
              router.push('/');
            }}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Reset game state when going back
            setGameState('playing');
            setScore(0);
            setStrikes(0);
            setLevel(1);
            setCombo(0);
            setBestCombo(0);
            setAnswerFeedback({});
            setShowFeedback(false);
            setIsGameActive(false);
            router.push('/');
          }}
        >
          <ArrowLeft size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
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
            {combo > 0 && (
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
          <Text style={[styles.problemText, gameMode === 'wordProblem' && styles.wordProblemText]}>
            {gameMode === 'wordProblem' ? problem.question : `${problem.question} = ?`}
          </Text>
          <View style={styles.levelBadge}>
            <Star size={12} color="#FFD700" />
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
          <Clock size={20} color={timeLeft <= (gameMode === 'wordProblem' ? 5 : 3) ? "#EF4444" : "#FFD700"} />
          <Text style={[styles.timerText, { color: timeLeft <= (gameMode === 'wordProblem' ? 5 : 3) ? "#EF4444" : "#FFD700" }]}>
            {timeLeft}s
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const feedback = answerFeedback[option];
            const isCorrect = feedback === 'correct';
            const isIncorrect = feedback === 'incorrect';
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isCorrect && styles.correctOption,
                  isIncorrect && styles.incorrectOption
                ]}
                onPress={() => handleAnswer(option)}
                disabled={gameState !== 'playing' || showFeedback}
              >
                <LinearGradient
                  colors={
                    isCorrect 
                      ? ['#10B981', '#059669'] 
                      : isIncorrect 
                        ? ['#EF4444', '#DC2626']
                        : ['#4C1D95', '#7C3AED', '#A855F7']
                  }
                  style={styles.optionGradient}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
  backButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50, // Add space for back button
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
  wordProblemText: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    paddingHorizontal: 10,
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
  correctOption: {
    borderWidth: 3,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  incorrectOption: {
    borderWidth: 3,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
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