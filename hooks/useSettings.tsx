import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  timeLimit: number;
  setTimeLimit: (limit: number) => void;
  gameMode: 'arithmetic' | 'wordProblem';
  setGameMode: (mode: 'arithmetic' | 'wordProblem') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  isGameActive: boolean;
  setIsGameActive: (active: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeLimit, setTimeLimit] = useState(5);
  const [gameMode, setGameMode] = useState<'arithmetic' | 'wordProblem'>('arithmetic');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  return (
    <SettingsContext.Provider
      value={{
        timeLimit,
        setTimeLimit,
        gameMode,
        setGameMode,
        soundEnabled,
        setSoundEnabled,
        hapticsEnabled,
        setHapticsEnabled,
        notifications,
        setNotifications,
        isGameActive,
        setIsGameActive,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 