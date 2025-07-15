import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SettingsProvider } from '@/hooks/useSettings';
import { AuthProvider } from '@/hooks/useAuth';

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <SettingsProvider>
        <Slot />
        <StatusBar style="auto" />
      </SettingsProvider>
    </AuthProvider>
  );
}
