import { Tabs } from 'expo-router';
import { Chrome as Home, Trophy, Settings } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';

export default function TabLayout() {
  const { isGameActive } = useSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          display: isGameActive ? 'none' : 'flex', // Hide tab bar during active game
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="difficulty"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="gameMode"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Scores',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}