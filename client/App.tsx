import { Barlow_600SemiBold, useFonts } from '@expo-google-fonts/barlow';;
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginHandler from './components/LoginHandler';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

export default function App() {
  const [googleFontLoaded] = useFonts({
    Barlow_600SemiBold
  })
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  if (!(googleFontLoaded && isLoadingComplete)) {
    return null;
  } else {
    return (
      <LoginHandler>
        <SafeAreaProvider>
          <Navigation colorScheme={colorScheme} />
          <StatusBar networkActivityIndicatorVisible />
        </SafeAreaProvider>
      </LoginHandler>
    );
  }
}
