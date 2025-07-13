import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  withSequence
} from 'react-native-reanimated';

const mockScores = [
  { rank: 1, name: 'MathWizard2024', score: 24750, level: 18, combo: 47 },
  { rank: 2, name: 'NumberNinja', score: 21200, level: 16, combo: 42 },
  { rank: 3, name: 'QuickCalc', score: 18800, level: 15, combo: 38 },
  { rank: 4, name: 'BrainMaster', score: 16650, level: 14, combo: 35 },
  { rank: 5, name: 'SpeedSolver', score: 14900, level: 13, combo: 31 },
  { rank: 6, name: 'MathGenius', score: 13200, level: 12, combo: 28 },
  { rank: 7, name: 'CalculatorKid', score: 11750, level: 11, combo: 25 },
  { rank: 8, name: 'NumberCruncher', score: 10300, level: 10, combo: 22 },
  { rank: 9, name: 'ArithmeticAce', score: 9100, level: 9, combo: 19 },
  { rank: 10, name: 'MathMaster', score: 8200, level: 8, combo: 16 },
];

export default function LeaderboardScreen() {
  const shimmer = useSharedValue(0);
  const crown = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    crown.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 })
      ), 
      -1, 
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-100, 400]) }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(crown.value, [0, 1], [1, 1.1]) }],
  }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Animated.View style={crownStyle}>
            <Crown size={24} color="#FFD700" fill="#FFD700" />
          </Animated.View>
        );
      case 2:
        return <Trophy size={22} color="#C0C0C0" fill="#C0C0C0" />;
      case 3:
        return <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumberContainer}>
            <Text style={styles.rankNumber}>{rank}</Text>
          </View>
        );
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)'];
      case 2:
        return ['rgba(192, 192, 192, 0.3)', 'rgba(192, 192, 192, 0.1)', 'rgba(192, 192, 192, 0.05)'];
      case 3:
        return ['rgba(205, 127, 50, 0.3)', 'rgba(205, 127, 50, 0.1)', 'rgba(205, 127, 50, 0.05)'];
      default:
        return ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'];
    }
  };

  const getBorderColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rgba(255, 215, 0, 0.5)';
      case 2:
        return 'rgba(192, 192, 192, 0.5)';
      case 3:
        return 'rgba(205, 127, 50, 0.5)';
      default:
        return 'rgba(255, 255, 255, 0.15)';
    }
  };

  return (
    <LinearGradient colors={['#0F0C29', '#24243e', '#302B63']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.headerIconGradient}
          >
            <Trophy size={32} color="white" />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Hall of Fame</Text>
        <Text style={styles.subtitle}>Elite Math Champions</Text>
        
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Star size={14} color="#FFD700" />
            <Text style={styles.headerStatText}>Global Rankings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.leaderboardContainer} showsVerticalScrollIndicator={false}>
        {mockScores.map((player, index) => (
          <View key={player.rank} style={styles.playerRowContainer}>
            <LinearGradient
              colors={getRankColors(player.rank)}
              style={[
                styles.playerRow,
                player.rank <= 3 && styles.topThreeRow,
                { borderColor: getBorderColor(player.rank) }
              ]}
            >
              {player.rank === 1 && (
                <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 215, 0, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              )}
              
              <View style={styles.rankContainer}>
                {getRankIcon(player.rank)}
              </View>
              
              <View style={styles.playerInfo}>
                <Text style={[
                  styles.playerName, 
                  player.rank <= 3 && styles.topThreeName,
                  player.rank === 1 && styles.championName
                ]}>
                  {player.name}
                  {player.rank === 1 && <Text style={styles.crownEmoji}> 👑</Text>}
                </Text>
                <View style={styles.playerDetails}>
                  <View style={styles.detailItem}>
                    <Star size={10} color="#FFD700" />
                    <Text style={styles.detailText}>Level {player.level}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Zap size={10} color="#FF6B6B" />
                    <Text style={styles.detailText}>{player.combo}x combo</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.scoreContainer}>
                <Text style={[
                  styles.playerScore, 
                  player.rank <= 3 && styles.topThreeScore,
                  player.rank === 1 && styles.championScore
                ]}>
                  {player.score.toLocaleString()}
                </Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      <View style={styles.yourScoreContainer}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.1)']}
          style={styles.yourScore}
        >
          <View style={styles.yourScoreHeader}>
            <Text style={styles.yourScoreLabel}>Your Best Performance</Text>
            <View style={styles.yourRankBadge}>
              <Text style={styles.yourRank}>#47</Text>
            </View>
          </View>
          
          <View style={styles.yourScoreStats}>
            <View style={styles.yourStatItem}>
              <Text style={styles.yourScoreValue}>2,847</Text>
              <Text style={styles.yourStatLabel}>Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.yourStatItem}>
              <Text style={styles.yourScoreValue}>Level 12</Text>
              <Text style={styles.yourStatLabel}>Peak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.yourStatItem}>
              <Text style={styles.yourScoreValue}>23x</Text>
              <Text style={styles.yourStatLabel}>Best Combo</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
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
    shadowColor: '#FFD700',
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
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  headerStatText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  leaderboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerRowContainer: {
    marginBottom: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  topThreeRow: {
    borderWidth: 2.5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  topThreeName: {
    color: '#FFD700',
  },
  championName: {
    fontSize: 17,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  crownEmoji: {
    fontSize: 14,
  },
  playerDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  playerScore: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#667eea',
  },
  topThreeScore: {
    color: '#FFD700',
    fontSize: 18,
  },
  championScore: {
    fontSize: 19,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pointsLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  yourScoreContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  yourScore: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  yourScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  yourScoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  yourRankBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  yourRank: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: 'bold',
  },
  yourScoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  yourStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  yourScoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 3,
  },
  yourStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
});